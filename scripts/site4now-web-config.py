#!/usr/bin/env python3
"""Prints the IIS web.config for the site4now deploy. Settings come from environment variables
(set by .github/workflows/deploy-site4now.yml); secrets end up only in the uploaded web.config, which IIS never serves."""
import os
from xml.sax.saxutils import quoteattr

env = os.environ


def conn_value(value: str) -> str:
    """Quotes a connection-string value when it holds characters that would end or confuse it."""
    if any(c in value for c in ';\'"=') or value != value.strip():
        return '"' + value.replace('"', '""') + '"'
    return value


api_url = env.get("API_URL", "").rstrip("/")
connection = ";".join([
    f"Server={env['DB_SERVER']}",
    f"Database={env['DB_NAME']}",
    f"User Id={env['DB_USER']}",
    f"Password={conn_value(env['DB_PASSWORD'])}",
    "Encrypt=True",
    "TrustServerCertificate=True",
])

settings = {
    "ASPNETCORE_ENVIRONMENT": "Production",
    "ConnectionStrings__Default": connection,
    "Auth__SigningKey": env["JWT_SIGNING_KEY"],
    "Storefront__MigrateOnStartup": "true",
    # HTTPS is enforced only when the site has an https address; a host's temporary http address would break otherwise.
    "Security__RequireHttps": "true" if api_url.startswith("https://") else "false",
    "Storage__Provider": "local",
    "Storage__LocalRoot": "App_Data/media",
    "Storage__PublicBaseUrl": f"{api_url}/media" if api_url else "/media",
    # Test servers: every account is on an active Pro plan.
    "Billing__TestMode": "true" if env.get("BILLING_TEST_MODE", "").lower() == "true" else "false",
}

# Where owners' websites (apps/sites) are hosted, when not yet at the brand domain.
if env.get("SITES_URL", "").strip():
    settings["Storefront__SitesBaseUrl"] = env["SITES_URL"].strip().rstrip("/")

variables = "\n".join(
    f"          <environmentVariable name={quoteattr(k)} value={quoteattr(v)} />" for k, v in settings.items()
)

print(f"""<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath=".\\Storefront.Web.exe" stdoutLogEnabled="true" stdoutLogFile=".\\logs\\stdout" hostingModel="outofprocess">
        <environmentVariables>
{variables}
        </environmentVariables>
      </aspNetCore>
      <httpProtocol>
        <customHeaders>
          <remove name="X-Powered-By" />
        </customHeaders>
      </httpProtocol>
    </system.webServer>
  </location>
</configuration>""")
