using System.Text.RegularExpressions;

namespace Storefront.Application.Common.Localization;

/// <summary>
/// Arabic for every message the API and the emails show to owners. Messages are written in English where they are raised
/// (Domain, Application, Infrastructure) and translated at the edge, where the response language is known.
/// Lookup order: the exact English sentence, then a sentence with placeholders (like "Add up to {0} photos."),
/// then the error code. Text comes first because one code can carry several wordings (media.size); the code is the
/// safety net, so a reworded message still reaches Arabic owners in Arabic. Every error code must have an entry
/// (enforced by MessagesCoverageTests).
/// </summary>
public static partial class Messages
{
    public const string English = "en";
    public const string Arabic = "ar";

    /// <summary>True for "ar" and regional forms like "ar-JO".</summary>
    public static bool IsArabic(string? locale) =>
        locale is not null && (locale.Equals(Arabic, StringComparison.OrdinalIgnoreCase) || locale.StartsWith("ar-", StringComparison.OrdinalIgnoreCase));

    /// <summary>The message in <paramref name="locale"/>. English (and anything not yet translated) comes back unchanged.</summary>
    public static string Translate(string english, string? code, string? locale)
    {
        if (!IsArabic(locale) || string.IsNullOrEmpty(english))
        {
            return english;
        }

        return TryArabicText(english) ?? (code is not null && ByCode.TryGetValue(code, out var byCode) ? byCode : english);
    }

    /// <summary>Arabic for a known English sentence (exact or with placeholders), or null.</summary>
    public static string? TryArabicText(string english)
    {
        if (ByText.TryGetValue(english, out var exact))
        {
            return exact;
        }

        foreach (var (pattern, arabic) in Patterns)
        {
            var match = pattern.Match(english);
            if (match.Success)
            {
                return Placeholder().Replace(arabic, m =>
                {
                    var group = match.Groups["p" + m.Groups[1].Value];
                    return group.Success ? group.Value : m.Value;
                });
            }
        }

        return null;
    }

    public static bool HasCode(string code) => ByCode.ContainsKey(code);

    public static IReadOnlyCollection<string> Codes => ByCode.Keys;

    /// <summary>Fallback per error code: the sentence an Arabic owner sees when the exact English wording is not in the catalog.</summary>
    private static readonly Dictionary<string, string> ByCode = new(StringComparer.Ordinal)
    {
        ["validation"] = "بعض الحقول تحتاج إلى مراجعة.",
        ["request.invalid"] = "تعذّرت قراءة الطلب.",

        ["auth.required"] = "سجّل الدخول للمتابعة.",
        ["auth.invalid"] = "البريد أو الهاتف أو كلمة المرور غير صحيحة. حاول مرة أخرى.",
        ["auth.locked"] = "محاولات كثيرة. انتظر 5 دقائق ثم حاول مرة أخرى.",
        ["auth.refresh"] = "انتهت جلستك. سجّل الدخول مرة أخرى.",
        ["auth.resetToken"] = "رابط إعادة التعيين غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.",
        ["account.exists"] = "يوجد حساب بهذه البيانات بالفعل.",

        ["business.notFound"] = "لم نعثر على النشاط.",
        ["business.name"] = "يجب أن يكون اسم النشاط من 1 إلى 60 حرفًا.",
        ["business.email"] = "تحقق من صيغة البريد، مثل name@business.com.",
        ["business.address"] = "يمكن أن يصل العنوان إلى 200 حرف.",
        ["business.instagram"] = "أدخل اسم المستخدم في إنستغرام، مثل yourshop.",
        ["business.facebook"] = "أدخل اسم صفحتك على فيسبوك أو رابطها، مثل facebook.com/yourshop.",
        ["business.tiktok"] = "أدخل اسم المستخدم في تيك توك، مثل ‎@yourshop.",
        ["business.snapchat"] = "أدخل اسم المستخدم في سناب شات، مثل yourshop.",
        ["business.timezone"] = "اختر منطقة زمنية من القائمة.",
        ["business.locale"] = "يجب أن تكون اللغة en أو ar.",
        ["business.currency"] = "اختر عملة من القائمة.",

        ["slug.invalid"] = "استخدم من 3 إلى 30 حرفًا إنجليزيًا صغيرًا أو رقمًا.",
        ["slug.reserved"] = "هذا الرابط غير متاح.",
        ["slug.unavailable"] = "هذا الرابط غير متاح. جرّب اسمًا آخر.",
        ["phone.invalid"] = "أدخل الرقم مع رمز الدولة، ويبدأ بعلامة ‎+.",
        ["money.currency"] = "يجب أن تكون العملة رمزًا من 3 أحرف إنجليزية.",

        ["category.notFound"] = "لم نعثر على الصنف.",
        ["category.name"] = "يمكن أن يصل اسم الصنف إلى 30 حرفًا.",
        ["category.duplicate"] = "لديك صنف بهذا الاسم بالفعل.",
        ["category.moveTo"] = "اختر صنفًا آخر لنقل المنتجات إليه.",
        ["category.hasProducts"] = "اختر أولًا أين تنتقل منتجات هذا الصنف.",
        ["category.parentSelf"] = "لا يمكن وضع الصنف داخل نفسه. اختر صنفًا رئيسيًا آخر.",
        ["category.parentNotFound"] = "اختر صنفًا رئيسيًا من قائمتك.",
        ["category.parent"] = "اختر صنفًا رئيسيًا، وليس صنفًا فرعيًا.",
        ["category.hasSubcategories"] = "لهذا الصنف أصناف فرعية، لذلك لا يمكن وضعه داخل صنف آخر. انقلها خارجه أولًا.",
        ["order.mismatch"] = "يجب أن تحتوي القائمة على كل عنصر مرة واحدة فقط. حدّث الصفحة وحاول مرة أخرى.",

        ["product.notFound"] = "لم نعثر على المنتج.",
        ["product.name"] = "يمكن أن يصل اسم المنتج إلى 60 حرفًا.",
        ["product.description"] = "يمكن أن يصل الوصف إلى 140 حرفًا.",
        ["product.price"] = "استخدم أرقامًا فقط، مثل 3.50.",
        ["product.label"] = "اختر شارة من القائمة.",
        ["product.customLabel"] = "اكتب نص الشارة، حتى 24 حرفًا في سطر واحد.",
        ["product.category"] = "اختر صنفًا.",
        ["product.image"] = "ارفع الصورة مرة أخرى.",

        ["media.empty"] = "اختر صورة لرفعها.",
        ["media.size"] = "الصورة كبيرة جدًا. جرّب صورة أخرى.",
        ["media.type"] = "ارفع صورة بصيغة JPEG أو PNG أو WebP.",
        ["media.dimensions"] = "دقة هذه الصورة عالية جدًا. استخدم صورة أقل من 24 ميغابكسل.",

        ["site.notFound"] = "لم نعثر على الموقع.",
        ["site.settings"] = "الإعدادات غير صالحة.",
        ["template.notFound"] = "اختر قالبًا من المعرض.",
        ["template.pro"] = "هذا القالب ضمن باقة Pro. انتقل إلى Pro لاستخدامه.",
        ["template.id"] = "معرّف القالب غير صالح.",
        ["template.number"] = "يجب أن يكون رقم القالب من 1 إلى 999.",
        ["template.name"] = "يجب أن يكون اسم القالب من 1 إلى 60 حرفًا.",
        ["template.category"] = "يجب أن تكون فئة القالب من 1 إلى 40 حرفًا.",
        ["template.tier"] = "يجب أن تكون باقة القالب basic أو pro.",

        ["subscription.notFound"] = "لا توجد باقة لهذا النشاط.",
        ["plan.unknown"] = "اختر Basic أو Pro.",
        ["plan.proRequired"] = "النطاق الخاص ضمن باقة Pro. انتقل إلى Pro أولًا.",

        ["domain.invalid"] = "أدخل نطاقًا مثل yourshop.com بدون مسافات.",
        ["domain.reserved"] = "استخدم نطاقًا تملكه، مثل yourshop.com.",
        ["domain.taken"] = "نشاط آخر يستخدم هذا النطاق بالفعل.",
        ["domainRequest.notFound"] = "لا يوجد طلب نطاق.",
        ["domainRequest.open"] = "لديك طلب نطاق قائم. ألغِه لتطلب نطاقًا آخر.",
        ["domainRequest.transition"] = "لا يمكن تغيير حالة هذا الطلب بهذه الطريقة.",

        ["import.empty"] = "اختر منتجًا واحدًا على الأقل لإضافته.",
        ["import.tooMany"] = "يمكنك إضافة 30 صنفًا و300 منتج كحد أقصى في المرة الواحدة.",

        ["ai.unavailable"] = "المساعد الذكي غير مفعّل بعد.",
        ["ai.busy"] = "المساعد الذكي مشغول الآن. حاول بعد دقيقة.",
        ["ai.failed"] = "لم يتمكن المساعد الذكي من الإجابة هذه المرة. حاول مرة أخرى.",
        ["ai.limit"] = "استخدمت كل طلبات المساعد الذكي لهذا الشهر.",
        ["ai.nothingFound"] = "لم نجد أي منتجات في هذه الصور. جرّب صورة أوضح.",
        ["ai.photos"] = "أضف من صورة إلى 3 صور.",
        ["ai.message"] = "اكتب رسالة.",
        ["ai.messages"] = "لم نتمكن من قراءة المحادثة. حاول مرة أخرى.",
    };

    /// <summary>Exact English sentences.</summary>
    private static readonly Dictionary<string, string> ByText = new(StringComparer.Ordinal)
    {
        // Shared and request-level
        ["Some fields need attention."] = "بعض الحقول تحتاج إلى مراجعة.",
        ["The request could not be read."] = "تعذّرت قراءة الطلب.",
        ["Too many requests. Wait a minute and try again."] = "طلبات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.",
        ["Use HTTPS."] = "استخدم اتصالًا آمنًا (HTTPS).",
        ["Check this value."] = "تحقق من هذه القيمة.",

        // Framework ProblemDetails titles (status code pages, auth challenges, unhandled errors)
        ["Bad Request"] = "طلب غير صالح.",
        ["Unauthorized"] = "سجّل الدخول للمتابعة.",
        ["Forbidden"] = "لا تملك صلاحية لهذا الإجراء.",
        ["Not Found"] = "لم نعثر على ما تبحث عنه.",
        ["Method Not Allowed"] = "هذا الإجراء غير مسموح.",
        ["Not Acceptable"] = "صيغة الرد المطلوبة غير مدعومة.",
        ["Request Timeout"] = "استغرق الطلب وقتًا طويلًا. حاول مرة أخرى.",
        ["Conflict"] = "تعارض مع بيانات موجودة.",
        ["Payload Too Large"] = "الملف كبير جدًا.",
        ["Content Too Large"] = "الملف كبير جدًا.",
        ["Request Entity Too Large"] = "الملف كبير جدًا.",
        ["Unsupported Media Type"] = "نوع المحتوى غير مدعوم.",
        ["Unprocessable Entity"] = "تعذّرت معالجة الطلب.",
        ["Too Many Requests"] = "طلبات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.",
        ["An error occurred while processing your request."] = "حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى.",
        ["Internal Server Error"] = "حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى.",
        ["Service Unavailable"] = "الخدمة غير متاحة الآن. حاول بعد قليل.",
        ["Bad Gateway"] = "الخدمة غير متاحة الآن. حاول بعد قليل.",
        ["Gateway Timeout"] = "الخدمة غير متاحة الآن. حاول بعد قليل.",
        ["One or more validation errors occurred."] = "بعض الحقول تحتاج إلى مراجعة.",

        // Accounts
        ["Log in to continue."] = "سجّل الدخول للمتابعة.",
        ["That email, phone or password doesn't match. Try again."] = "البريد أو الهاتف أو كلمة المرور غير صحيحة. حاول مرة أخرى.",
        ["Too many tries. Wait 5 minutes and try again."] = "محاولات كثيرة. انتظر 5 دقائق ثم حاول مرة أخرى.",
        ["Your session has ended. Log in again."] = "انتهت جلستك. سجّل الدخول مرة أخرى.",
        ["This reset link is not valid or has expired. Ask for a new one."] = "رابط إعادة التعيين غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.",
        ["This reset link is not valid. Ask for a new one."] = "رابط إعادة التعيين غير صالح. اطلب رابطًا جديدًا.",
        ["An account already exists."] = "يوجد حساب بهذه البيانات بالفعل.",
        ["An account with this email already exists. Log in instead."] = "يوجد حساب بهذا البريد بالفعل. سجّل الدخول بدلًا من ذلك.",
        ["An account with this phone number already exists. Log in instead."] = "يوجد حساب بهذا الرقم بالفعل. سجّل الدخول بدلًا من ذلك.",
        ["Enter your email or phone number."] = "أدخل بريدك الإلكتروني أو رقم هاتفك.",
        ["Enter your password."] = "أدخل كلمة المرور.",
        ["Add a number to your password."] = "أضف رقمًا إلى كلمة المرور.",
        ["Add a capital letter to your password."] = "أضف حرفًا إنجليزيًا كبيرًا إلى كلمة المرور.",
        ["Password can be at most 128 characters."] = "يمكن أن تصل كلمة المرور إلى 128 حرفًا.",
        ["Enter your email."] = "أدخل بريدك الإلكتروني.",
        ["Check the email format, like name@business.com."] = "تحقق من صيغة البريد، مثل name@business.com.",
        ["Enter your business name."] = "أدخل اسم نشاطك.",
        ["Business name can be at most 60 characters."] = "يمكن أن يصل اسم النشاط إلى 60 حرفًا.",
        ["Enter your phone number."] = "أدخل رقم هاتفك.",
        ["Enter a full phone number with the country code."] = "أدخل رقم الهاتف كاملًا مع رمز الدولة.",
        ["Language must be en or ar."] = "يجب أن تكون اللغة en أو ar.",
        ["Add at least one English letter or number for your link."] = "أضف حرفًا إنجليزيًا أو رقمًا واحدًا على الأقل لرابطك.",
        ["Your link needs at least 3 English letters or numbers."] = "يحتاج رابطك إلى 3 أحرف إنجليزية أو أرقام على الأقل.",
        ["This address is not available."] = "هذا الرابط غير متاح.",
        ["Use 3 to 30 lowercase letters and numbers."] = "استخدم من 3 إلى 30 حرفًا إنجليزيًا صغيرًا أو رقمًا.",
        ["Enter the number with its country code, starting with +."] = "أدخل الرقم مع رمز الدولة، ويبدأ بعلامة ‎+.",

        // Business profile
        ["Business not found."] = "لم نعثر على النشاط.",
        ["Address can be at most 200 characters."] = "يمكن أن يصل العنوان إلى 200 حرف.",
        ["Enter your Instagram username, like yourshop."] = "أدخل اسم المستخدم في إنستغرام، مثل yourshop.",
        ["Enter your Facebook page name or link, like facebook.com/yourshop."] = "أدخل اسم صفحتك على فيسبوك أو رابطها، مثل facebook.com/yourshop.",
        ["Enter your TikTok username, like @yourshop."] = "أدخل اسم المستخدم في تيك توك، مثل ‎@yourshop.",
        ["Enter your Snapchat username, like yourshop."] = "أدخل اسم المستخدم في سناب شات، مثل yourshop.",
        ["Choose a time zone from the list."] = "اختر منطقة زمنية من القائمة.",
        ["Choose a currency from the list."] = "اختر عملة من القائمة.",
        ["Currency must be a 3-letter ISO code."] = "يجب أن تكون العملة رمزًا من 3 أحرف إنجليزية.",

        // Catalog
        ["Category not found."] = "لم نعثر على الصنف.",
        ["Product not found."] = "لم نعثر على المنتج.",
        ["Enter a category name."] = "أدخل اسم الصنف.",
        ["Category names can be up to 30 characters."] = "يمكن أن يصل اسم الصنف إلى 30 حرفًا.",
        ["You already have a category with that name."] = "لديك صنف بهذا الاسم بالفعل.",
        ["Choose another category to move the products to."] = "اختر صنفًا آخر لنقل المنتجات إليه.",
        ["A category can't go inside itself. Choose another main category."] = "لا يمكن وضع الصنف داخل نفسه. اختر صنفًا رئيسيًا آخر.",
        ["Choose a main category from your list."] = "اختر صنفًا رئيسيًا من قائمتك.",
        ["Choose a main category, not a sub-category."] = "اختر صنفًا رئيسيًا، وليس صنفًا فرعيًا.",
        ["This category has its own sub-categories, so it can't go inside another one. Move them out first."] = "لهذا الصنف أصناف فرعية، لذلك لا يمكن وضعه داخل صنف آخر. انقلها خارجه أولًا.",
        ["The list must contain each item exactly once. Refresh and try again."] = "يجب أن تحتوي القائمة على كل عنصر مرة واحدة فقط. حدّث الصفحة وحاول مرة أخرى.",
        ["Enter a product name."] = "أدخل اسم المنتج.",
        ["Product names can be up to 60 characters."] = "يمكن أن يصل اسم المنتج إلى 60 حرفًا.",
        ["Descriptions can be up to 140 characters."] = "يمكن أن يصل الوصف إلى 140 حرفًا.",
        ["Type the label text."] = "اكتب نص الشارة.",
        ["Keep the label on one line."] = "اكتب الشارة في سطر واحد.",
        ["Labels can be up to 24 characters."] = "يمكن أن تصل الشارة إلى 24 حرفًا.",
        ["Enter a price."] = "أدخل السعر.",
        ["Use numbers only, like 3.50."] = "استخدم أرقامًا فقط، مثل 3.50.",
        ["That price is too high."] = "هذا السعر مرتفع جدًا.",
        ["Price must be 0 or more."] = "يجب أن يكون السعر 0 أو أكثر.",
        ["Choose a category."] = "اختر صنفًا.",
        ["Upload the photo again."] = "ارفع الصورة مرة أخرى.",

        // Photos
        ["Choose a photo to upload."] = "اختر صورة لرفعها.",
        ["Images can be up to 5 MB."] = "يمكن أن يصل حجم الصورة إلى 5 ميغابايت.",
        ["Images can be up to 1 MB after compression."] = "يمكن أن يصل حجم الصورة إلى 1 ميغابايت بعد الضغط.",
        ["Upload a JPEG, PNG or WebP image."] = "ارفع صورة بصيغة JPEG أو PNG أو WebP.",
        ["We couldn't read that photo. Upload a JPEG, PNG or WebP image."] = "تعذّرت قراءة هذه الصورة. ارفع صورة بصيغة JPEG أو PNG أو WebP.",
        ["This photo has too many pixels. Use one under 24 megapixels."] = "دقة هذه الصورة عالية جدًا. استخدم صورة أقل من 24 ميغابكسل.",
        ["This photo is too detailed to compress. Try another one."] = "تفاصيل هذه الصورة كثيرة ولا يمكن ضغطها. جرّب صورة أخرى.",

        // Site design and templates
        ["Site not found."] = "لم نعثر على الموقع.",
        ["Choose a template from the gallery."] = "اختر قالبًا من المعرض.",
        ["This template is part of the Pro plan. Upgrade to Pro to use it."] = "هذا القالب ضمن باقة Pro. انتقل إلى Pro لاستخدامه.",
        ["Settings must be an object."] = "الإعدادات غير صالحة.",
        ["This template has no such setting."] = "هذا القالب لا يحتوي على هذا الإعداد.",
        ["Enter text."] = "أدخل نصًا.",
        ["Choose a value."] = "اختر قيمة.",
        ["Choose a color, like #D9542C."] = "اختر لونًا، مثل ‎#D9542C.",
        ["Turn this on or off."] = "فعّل هذا الخيار أو أوقفه.",
        ["Put the sections in order."] = "رتّب الأقسام.",
        ["Choose which ones are on."] = "اختر ما تريد تفعيله.",
        ["Add photos."] = "أضف صورًا.",
        ["Add your opening hours."] = "أضف ساعات العمل.",
        ["Use times like 08:00-23:00, or closed."] = "استخدم أوقاتًا مثل 08:00-23:00، أو closed للإغلاق.",
        ["Choose a photo."] = "اختر صورة.",
        ["Choose one of the template's pictures."] = "اختر إحدى صور القالب.",
        ["Template number must be 1 to 999."] = "يجب أن يكون رقم القالب من 1 إلى 999.",
        ["Template tier must be basic or pro."] = "يجب أن تكون باقة القالب basic أو pro.",

        // Billing and domains
        ["No plan found for this business."] = "لا توجد باقة لهذا النشاط.",
        ["Choose Basic or Pro."] = "اختر Basic أو Pro.",
        ["There is no domain request."] = "لا يوجد طلب نطاق.",
        ["Your own domain is part of the Pro plan. Upgrade to Pro first."] = "النطاق الخاص ضمن باقة Pro. انتقل إلى Pro أولًا.",
        ["You already have a domain request. Cancel it to ask for another domain."] = "لديك طلب نطاق قائم. ألغِه لتطلب نطاقًا آخر.",
        ["Another business already uses this domain."] = "نشاط آخر يستخدم هذا النطاق بالفعل.",
        ["Use a domain you own, like yourshop.com."] = "استخدم نطاقًا تملكه، مثل yourshop.com.",
        ["Enter a domain like yourshop.com, without spaces."] = "أدخل نطاقًا مثل yourshop.com بدون مسافات.",

        // Adding many products at once
        ["Choose at least one product to add."] = "اختر منتجًا واحدًا على الأقل لإضافته.",
        ["Add up to 30 categories and 300 products at a time."] = "يمكنك إضافة 30 صنفًا و300 منتج كحد أقصى في المرة الواحدة.",

        // AI helper
        ["The AI helper isn't switched on yet."] = "المساعد الذكي غير مفعّل بعد.",
        ["The AI helper is busy. Try again in a minute."] = "المساعد الذكي مشغول الآن. حاول بعد دقيقة.",
        ["The AI helper couldn't answer this time. Try again."] = "لم يتمكن المساعد الذكي من الإجابة هذه المرة. حاول مرة أخرى.",
        ["You've used all your AI helper requests for this month."] = "استخدمت كل طلبات المساعد الذكي لهذا الشهر.",
        ["We couldn't find any products in these photos. Try a sharper photo."] = "لم نجد أي منتجات في هذه الصور. جرّب صورة أوضح.",
        ["Add 1 to 3 photos."] = "أضف من صورة إلى 3 صور.",
        ["Keep the note under 300 characters."] = "اجعل الملاحظة أقل من 300 حرف.",
        ["Write a message."] = "اكتب رسالة.",
        ["We couldn't read the conversation. Try again."] = "لم نتمكن من قراءة المحادثة. حاول مرة أخرى.",
        ["Send up to 20 messages."] = "أرسل 20 رسالة كحد أقصى.",
        ["Keep each message under 1000 characters."] = "اجعل كل رسالة أقل من 1000 حرف.",
        ["Done. Have a look at the preview."] = "تم. ألقِ نظرة على المعاينة.",
    };

    /// <summary>English sentences with placeholders {0}, {1}... and their Arabic, which may use any of them.</summary>
    private static readonly (Regex Pattern, string Arabic)[] Patterns = Build(
    [
        ("Password needs at least {0} characters.", "يجب أن تتكون كلمة المرور من {0} أحرف على الأقل."),
        ("That link is taken. Try adding your area, like {0}.", "هذا الرابط محجوز. جرّب إضافة اسم منطقتك، مثل {0}."),
        ("Choose where its 1 product go first.", "اختر أولًا أين ينتقل منتجه الوحيد."),
        ("Choose where its {0} products go first.", "اختر أولًا أين تنتقل منتجاته ({0})."),
        ("Choose a label: {0}.", "اختر شارة: {0}."),
        ("Label must be one of: {0}.", "يجب أن تكون الشارة واحدة من: {0}."),
        ("A request that is {0} cannot become {1}.", "لا يمكن تغيير حالة هذا الطلب بهذه الطريقة."),
        ("{0} must be {1} to {2} characters.", "يجب أن يكون النص من {1} إلى {2} حرفًا."),
        ("{0} can be at most {1} characters.", "يمكن أن يصل النص إلى {1} حرفًا."),
        ("Choose one of: {0}.", "اختر واحدًا من: {0}."),
        ("Choose from: {0}.", "اختر من: {0}."),
        ("Put these sections in order, each once: {0}.", "رتّب هذه الأقسام، كل قسم مرة واحدة: {0}."),
        ("Use up to {0} characters.", "استخدم {0} حرفًا كحد أقصى."),
        ("Choose a value from {0} to {1}.", "اختر قيمة من {0} إلى {1}."),
        ("Use steps of {0}.", "استخدم زيادات قدرها {0}."),
        ("Add up to {0} photos.", "أضف حتى {0} صور."),
        ("Unknown day \"{0}\".", "يوم غير معروف \"{0}\"."),
        ("Unknown setting type \"{0}\".", "نوع إعداد غير معروف \"{0}\"."),
    ]);

    private static (Regex, string)[] Build((string English, string Arabic)[] entries) => entries
        .Select(e => (new Regex(
            "^" + Placeholder().Replace(Regex.Escape(e.English).Replace("\\{", "{", StringComparison.Ordinal), m => $"(?<p{m.Groups[1].Value}>.+?)") + "$",
            RegexOptions.CultureInvariant | RegexOptions.Singleline), e.Arabic))
        .ToArray();

    [GeneratedRegex(@"\{(\d+)\}")]
    private static partial Regex Placeholder();
}
