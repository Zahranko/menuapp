import { brand } from "@/lib/brand";

export default function SiteNotFound() {
  return (
    <main className="nf">
      <div>
        <p className="nf-code">404</p>
        <h1>This menu isn’t here</h1>
        <p>Check the link, or ask the business for their new address.</p>
        <a href={`https://${brand.domain}`}>Make your own menu with {brand.brandName}</a>
      </div>
    </main>
  );
}
