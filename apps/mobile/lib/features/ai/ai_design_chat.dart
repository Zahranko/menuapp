import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../design/design_models.dart';
import 'ai_repository.dart';
import 'ai_widgets.dart';

/// Merges settings into the editor's draft (the editor saves it and refreshes the preview). A null value puts the setting
/// back to the template's default.
typedef ApplySettings = Future<void> Function(Map<String, dynamic> settings);

/// One bubble of the chat.
class AiChatBubble {
  AiChatBubble.owner(this.text, {this.photo})
      : fromOwner = true,
        changed = const {};

  AiChatBubble.assistant(this.text, {this.changed = const {}})
      : fromOwner = false,
        photo = null;

  final bool fromOwner;
  final String text;

  /// The photo the owner sent with this message, shown as a thumbnail.
  final Uint8List? photo;

  /// The settings this answer changed, with the values they had before, so Undo can put exactly those back.
  final Map<String, Object?> changed;
  bool undone = false;
}

/// The editor's conversation with the assistant. The editor keeps one for as long as it is open, so closing and reopening
/// the chat carries on where the owner left off.
class AiChatController extends ChangeNotifier {
  /// [_language] is "en" or "ar", usually the website's language.
  AiChatController(this._language);

  final messages = <AiChatBubble>[];
  bool busy = false;

  /// The last failed call, shown under the conversation until the next message.
  Object? error;

  String _language;

  /// "en" or "ar": the language the assistant writes its replies and the website texts in.
  String get language => _language;

  set language(String value) {
    _language = value;
    notifyListeners();
  }

  void clear() {
    messages.clear();
    error = null;
    notifyListeners();
  }

  /// Sends [text] (and [photo]) with the conversation so far. Settings the answer changes are applied to the draft right
  /// away through [onApply]; only [keys] (the settings the editor shows) are taken. Returns false when the call failed:
  /// the owner's message is then taken back so they can send it again.
  Future<bool> send({
    required AiRepository repo,
    required String text,
    AiPhoto? photo,
    required Set<String> keys,
    required Map<String, dynamic> Function() values,
    required ApplySettings onApply,
    bool surprise = false,
  }) async {
    if (busy) return false;
    final mine = AiChatBubble.owner(text, photo: photo?.bytes);
    messages.add(mine);
    busy = true;
    error = null;
    notifyListeners();
    try {
      final answer = await repo.chat(_turns(), language: _language, photo: photo, surprise: surprise);
      final change = SettingsChange.of(answer.settings, keys: keys, current: values());
      if (change.patch.isNotEmpty) await onApply(change.patch);
      messages.add(AiChatBubble.assistant(answer.reply, changed: change.before));
      return true;
    } catch (e) {
      messages.remove(mine);
      error = e;
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  /// Puts back the values the answer [bubble] replaced.
  Future<void> undo(AiChatBubble bubble, ApplySettings onApply) async {
    if (bubble.undone || bubble.changed.isEmpty) return;
    await SettingsChange.undo(bubble.changed, onApply);
    bubble.undone = true;
    notifyListeners();
  }

  /// The conversation as the server reads it. An undone answer says so, so the assistant doesn't count on those changes.
  List<AiChatTurn> _turns() => [
        for (final m in messages)
          (
            role: m.fromOwner ? 'owner' : 'assistant',
            text: m.undone ? '${m.text} (The owner undid these changes.)' : m.text,
          ),
      ];

}

/// A change to the draft that can be undone: the new values ([patch]) and the values they replace ([before]; null for a
/// setting the draft didn't have, which Undo puts back to the template's default). Used by the AI chat and the Looks strip.
class SettingsChange {
  const SettingsChange(this.patch, this.before);

  /// The entries of [proposed] that are among [keys] (the settings the editor shows) and differ from [current].
  factory SettingsChange.of(Map<String, dynamic> proposed, {required Set<String> keys, required Map<String, dynamic> current}) {
    final patch = {
      for (final e in proposed.entries)
        if (keys.contains(e.key) && !same(current[e.key], e.value)) e.key: e.value,
    };
    return SettingsChange(patch, {for (final k in patch.keys) k: current[k]});
  }

  final Map<String, dynamic> patch;
  final Map<String, Object?> before;

  /// Puts back the values a change replaced.
  static Future<void> undo(Map<String, Object?> before, ApplySettings onApply) => onApply(Map<String, dynamic>.of(before));

  static bool same(Object? a, Object? b) {
    if (a is num && b is num) return a == b;
    return jsonEncode(a) == jsonEncode(b);
  }
}

/// The editor's AI card: one entry that opens the chat. Hidden when the status can't be read; shown dimmed with a note
/// when the assistant is off or used up this month.
class AiDesignAssistant extends ConsumerWidget {
  const AiDesignAssistant({super.key, required this.chat, required this.fields, required this.values, required this.onApply});

  final AiChatController chat;

  /// The current template's fields as the editor shows them; the assistant only changes these.
  final List<TemplateField> fields;

  /// The draft's current values, read when an answer arrives (for Undo).
  final Map<String, dynamic> Function() values;
  final ApplySettings onApply;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final status = ref.watch(aiStatusProvider).value;
    if (status == null) return const SizedBox.shrink();
    return SectionCard(
      key: const Key('aiAssistant'),
      title: t.aiAssistant,
      icon: aiIcon,
      subtitle: t.aiAssistantSub,
      children: [
        ListenableBuilder(
          listenable: chat,
          builder: (context, _) => AiActionRow(
            key: const Key('aiOpenChat'),
            icon: Icons.forum_outlined,
            title: chat.messages.isEmpty ? t.aiChatOpen : t.aiChatContinue,
            subtitle: t.aiChatOpenSub,
            onTap: status.usable || chat.messages.isNotEmpty ? () => openChat(context) : null,
          ),
        ),
        const SizedBox(height: 12),
        AiStatusLine(status: status),
      ],
    );
  }

  Future<void> openChat(BuildContext context) => showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        showDragHandle: true,
        // A light veil: the preview above the sheet stays visible, so each change shows while the owner chats.
        barrierColor: Colors.black.withValues(alpha: 0.18),
        builder: (_) => AiDesignChat(chat: chat, fields: fields, values: values, onApply: onApply),
      );
}

/// The chat: bubbles, starter suggestions, a text field with photo and send buttons, and the uses left this month.
class AiDesignChat extends ConsumerStatefulWidget {
  const AiDesignChat({super.key, required this.chat, required this.fields, required this.values, required this.onApply});

  final AiChatController chat;
  final List<TemplateField> fields;
  final Map<String, dynamic> Function() values;
  final ApplySettings onApply;

  @override
  ConsumerState<AiDesignChat> createState() => _AiDesignChatState();
}

class _AiDesignChatState extends ConsumerState<AiDesignChat> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  AiPhoto? _photo;
  bool _showLanguage = false;

  AiChatController get _chat => widget.chat;

  @override
  void initState() {
    super.initState();
    _chat.addListener(_changed);
    WidgetsBinding.instance.addPostFrameCallback((_) => _toEnd());
  }

  @override
  void dispose() {
    _chat.removeListener(_changed);
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _changed() {
    if (!mounted) return;
    setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) => _toEnd());
  }

  void _toEnd() {
    if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
  }

  Future<void> _pick({required bool camera}) async {
    final photo = await ref.read(aiPhotoPickerProvider).one(camera: camera);
    if (photo != null && mounted) setState(() => _photo = photo);
  }

  Future<void> _send([String? preset, bool surprise = false]) async {
    final t = AppLocalizations.of(context);
    final typed = (preset ?? _input.text).trim();
    final photo = _photo;
    final text = typed.isNotEmpty ? typed : (photo != null ? t.aiChatPhotoMessage : '');
    if (text.isEmpty || _chat.busy) return;
    if (preset == null) _input.clear();
    setState(() => _photo = null);
    final ok = await _chat.send(
      repo: ref.read(aiRepositoryProvider),
      text: text,
      photo: photo,
      keys: {for (final f in widget.fields) f.key},
      values: widget.values,
      onApply: widget.onApply,
      surprise: surprise,
    );
    ref.invalidate(aiStatusProvider);
    if (!ok && mounted) {
      // Nothing was lost: the message and photo come back to send again.
      if (preset == null && _input.text.isEmpty) _input.text = typed;
      setState(() => _photo ??= photo);
    }
  }

  /// "Match my logo colors" needs the logo: pick it first, then send.
  Future<void> _matchLogo(String text) async {
    await _pick(camera: false);
    if (_photo != null) await _send(text);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final media = MediaQuery.of(context);
    final status = ref.watch(aiStatusProvider).value;
    final canSend = !_chat.busy && (status == null || status.usable);
    final height = math.max(300.0, math.min(media.size.height * 0.64, media.size.height - media.viewInsets.bottom - 60));
    final messages = _chat.messages;

    return Padding(
      padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
      child: SizedBox(
        height: height,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 12, 8),
            child: Row(children: [
              const IconTile(aiIcon, size: 32),
              const SizedBox(width: 8),
              Expanded(
                // Shrinks a little on narrow phones instead of cutting the name.
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(t.aiAssistant, maxLines: 1, style: Ui.display(context, 18, weight: FontWeight.w700)),
                ),
              ),
              TextButton.icon(
                key: const Key('aiChatLanguageButton'),
                onPressed: () => setState(() => _showLanguage = !_showLanguage),
                style: TextButton.styleFrom(visualDensity: VisualDensity.compact, padding: const EdgeInsets.symmetric(horizontal: 8)),
                icon: const Icon(Icons.translate_rounded, size: 17),
                label: Text(_chat.language == 'ar' ? t.languageArabic : t.languageEnglish, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
              ),
              if (messages.isNotEmpty)
                IconButton(
                  key: const Key('aiChatStartOver'),
                  tooltip: t.aiChatStartOver,
                  visualDensity: VisualDensity.compact,
                  onPressed: _chat.busy ? null : _chat.clear,
                  icon: const Icon(Icons.refresh_rounded),
                ),
            ]),
          ),
          if (_showLanguage)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: AiLanguageChoice(value: _chat.language, onChanged: (l) => _chat.language = l),
            ),
          Divider(height: 1, color: BrandColors.hairline),
          Expanded(
            child: ListView(
              key: const Key('aiChatMessages'),
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              children: [
                _Bubble(text: t.aiChatWelcome, fromOwner: false),
                if (messages.isEmpty) ...[
                  const SizedBox(height: 4),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    _Suggestion(t.aiChatSurprise, key: const Key('aiChatSurprise'), icon: Icons.auto_awesome_rounded, onTap: canSend ? () => _send(t.aiChatSurprise, true) : null),
                    _Suggestion(t.aiChatSuggestLogo, icon: Icons.palette_outlined, onTap: canSend ? () => _matchLogo(t.aiChatSuggestLogo) : null),
                    _Suggestion(t.aiChatSuggestTexts, icon: Icons.edit_note_rounded, onTap: canSend ? () => _send(t.aiChatSuggestTexts) : null),
                    _Suggestion(t.aiChatSuggestLogoSize, icon: Icons.open_in_full_rounded, onTap: canSend ? () => _send(t.aiChatSuggestLogoSize) : null),
                    _Suggestion(t.aiChatSuggestElegant, icon: Icons.dark_mode_outlined, onTap: canSend ? () => _send(t.aiChatSuggestElegant) : null),
                  ]),
                ],
                for (final (i, m) in messages.indexed) ...[
                  _Bubble(text: m.text, fromOwner: m.fromOwner, photo: m.photo),
                  if (m.changed.isNotEmpty) _Changes(index: i, bubble: m, fields: widget.fields, onUndo: _chat.busy ? null : () => _chat.undo(m, widget.onApply)),
                ],
                if (_chat.busy) const _Typing(),
              ],
            ),
          ),
          if (_chat.error != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: AiNote(errorText(t, _chat.error!), icon: Icons.error_outline_rounded),
            ),
          if (_photo != null) _AttachedPhoto(photo: _photo!, onRemove: () => setState(() => _photo = null)),
          _Composer(
            controller: _input,
            enabled: canSend,
            onSend: () => _send(),
            onPhoto: (camera) => _pick(camera: camera),
          ),
          if (status != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 2, 20, 10),
              child: AiStatusLine(status: status),
            ),
        ]),
      ),
    );
  }
}

/// The text field with the photo and send buttons.
class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.enabled, required this.onSend, required this.onPhoto});

  final TextEditingController controller;
  final bool enabled;
  final VoidCallback onSend;
  final ValueChanged<bool> onPhoto;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 6, 12, 4),
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        PopupMenuButton<bool>(
          key: const Key('aiChatPhoto'),
          tooltip: t.aiAddPhoto,
          enabled: enabled,
          icon: Icon(Icons.add_photo_alternate_outlined, color: BrandColors.ink),
          onSelected: onPhoto,
          itemBuilder: (_) => [
            PopupMenuItem(value: true, child: ListTile(leading: const Icon(Icons.photo_camera_outlined), title: Text(t.aiTakePhoto))),
            PopupMenuItem(value: false, child: ListTile(leading: const Icon(Icons.photo_library_outlined), title: Text(t.aiChoosePhoto))),
          ],
        ),
        Expanded(
          child: TextField(
            key: const Key('aiChatInput'),
            controller: controller,
            minLines: 1,
            maxLines: 4,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.send,
            inputFormatters: [LengthLimitingTextInputFormatter(1000)],
            onSubmitted: enabled ? (_) => onSend() : null,
            decoration: InputDecoration(
              hintText: t.aiChatHint,
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(22)),
            ),
          ),
        ),
        const SizedBox(width: 8),
        IconButton.filled(
          key: const Key('aiChatSend'),
          tooltip: t.aiChatSend,
          onPressed: enabled ? onSend : null,
          style: IconButton.styleFrom(backgroundColor: BrandColors.primary, foregroundColor: Colors.white, fixedSize: const Size(46, 46)),
          // The arrow points the way the text runs.
          icon: Icon(Icons.send_rounded, textDirection: Directionality.of(context)),
        ),
      ]),
    );
  }
}

/// The picked photo, waiting to be sent, with a button to take it off.
class _AttachedPhoto extends StatelessWidget {
  const _AttachedPhoto({required this.photo, required this.onRemove});

  final AiPhoto photo;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(20, 4, 20, 2),
        child: Row(children: [
          ClipRRect(borderRadius: BorderRadius.circular(10), child: Image.memory(photo.bytes, width: 52, height: 52, fit: BoxFit.cover)),
          const SizedBox(width: 6),
          IconButton(tooltip: AppLocalizations.of(context).aiRemovePhoto, onPressed: onRemove, icon: const Icon(Icons.close_rounded, size: 20)),
        ]),
      );
}

/// A starter idea for an empty chat; tapping it sends it.
class _Suggestion extends StatelessWidget {
  const _Suggestion(this.text, {super.key, required this.icon, required this.onTap});

  final String text;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => ActionChip(
        avatar: Icon(icon, size: 18, color: BrandColors.primary),
        label: Text(text),
        onPressed: onTap,
        backgroundColor: Colors.white,
        side: BorderSide(color: BrandColors.line),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
      );
}

/// One message: the owner's on the trailing side in the brand color, the assistant's on the leading side.
class _Bubble extends StatelessWidget {
  const _Bubble({required this.text, required this.fromOwner, this.photo});

  final String text;
  final bool fromOwner;
  final Uint8List? photo;

  @override
  Widget build(BuildContext context) {
    const round = Radius.circular(18);
    const tail = Radius.circular(5);
    return Align(
      alignment: fromOwner ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.8),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: fromOwner ? BrandColors.primary : BrandColors.tint,
            borderRadius: BorderRadiusDirectional.only(
              topStart: round,
              topEnd: round,
              bottomStart: fromOwner ? round : tail,
              bottomEnd: fromOwner ? tail : round,
            ),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            if (photo != null) ...[
              ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.memory(photo!, width: 140, height: 140, fit: BoxFit.cover)),
              const SizedBox(height: 8),
            ],
            Text(
              text,
              textDirection: _directionOf(text),
              style: TextStyle(color: fromOwner ? Colors.white : BrandColors.ink, fontSize: 15, height: 1.4),
            ),
          ]),
        ),
      ),
    );
  }

  /// The direction of the first letter, so an Arabic reply reads right to left even in the English app, and the other way round.
  static TextDirection? _directionOf(String text) {
    for (final rune in text.runes) {
      if ((rune >= 0x0600 && rune <= 0x06FF) || (rune >= 0x0750 && rune <= 0x077F) || (rune >= 0xFB50 && rune <= 0xFEFF)) return TextDirection.rtl;
      if ((rune >= 0x41 && rune <= 0x5A) || (rune >= 0x61 && rune <= 0x7A) || (rune >= 0xC0 && rune <= 0x24F)) return TextDirection.ltr;
    }
    return null;
  }
}

/// Under an answer that changed the draft: what changed, and Undo.
class _Changes extends StatelessWidget {
  const _Changes({required this.index, required this.bubble, required this.fields, required this.onUndo});

  final int index;
  final AiChatBubble bubble;
  final List<TemplateField> fields;
  final VoidCallback? onUndo;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final labels = [
      for (final f in fields)
        if (bubble.changed.containsKey(f.key)) f.labelFor(context),
    ];
    final separator = Directionality.of(context) == TextDirection.rtl ? '، ' : ', ';
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 6, bottom: 6),
      child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
        Icon(bubble.undone ? Icons.undo_rounded : Icons.check_circle_rounded, size: 17, color: bubble.undone ? BrandColors.muted : BrandColors.live),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            bubble.undone ? t.aiChatUndone : '${t.aiChatChanged(bubble.changed.length)}: ${labels.join(separator)}',
            key: Key('aiChatChanges-$index'),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: BrandColors.muted, fontSize: 12.5, height: 1.3),
          ),
        ),
        if (!bubble.undone)
          TextButton(
            key: Key('aiChatUndo-$index'),
            onPressed: onUndo,
            style: TextButton.styleFrom(minimumSize: const Size(0, 36), padding: const EdgeInsets.symmetric(horizontal: 10)),
            child: Text(t.aiChatUndo),
          ),
      ]),
    );
  }
}

/// The assistant is working: three dots that pulse, and a short line.
class _Typing extends StatefulWidget {
  const _Typing();

  @override
  State<_Typing> createState() => _TypingState();
}

class _TypingState extends State<_Typing> with SingleTickerProviderStateMixin {
  late final _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))..repeat();

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Align(
      alignment: AlignmentDirectional.centerStart,
      child: Container(
        key: const Key('aiChatTyping'),
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(color: BrandColors.tint, borderRadius: BorderRadius.circular(18)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          AnimatedBuilder(
            animation: _pulse,
            builder: (context, _) => Row(children: [
              for (var i = 0; i < 3; i++)
                Container(
                  width: 7,
                  height: 7,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: BrandColors.primary.withValues(alpha: 0.25 + 0.75 * (0.5 + 0.5 * math.sin((_pulse.value - i * 0.18) * 2 * math.pi)).clamp(0, 1)),
                  ),
                ),
            ]),
          ),
          const SizedBox(width: 10),
          Text(t.aiChatWorking, style: TextStyle(color: BrandColors.muted, fontSize: 13.5)),
        ]),
      ),
    );
  }
}
