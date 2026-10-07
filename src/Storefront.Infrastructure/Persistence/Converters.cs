using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Storefront.Domain.Common;

namespace Storefront.Infrastructure.Persistence;

internal sealed class SlugConverter() : ValueConverter<Slug, string>(v => v.Value, v => Slug.FromStorage(v));

internal sealed class DomainNameConverter() : ValueConverter<DomainName, string>(v => v.Value, v => DomainName.Create(v));

internal sealed class PhoneNumberConverter() : ValueConverter<PhoneNumber, string>(v => v.Value, v => PhoneNumber.Create(v, "phone"));
