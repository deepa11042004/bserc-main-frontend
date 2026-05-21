import FeaturedWorkshopManager from "@/components/admin/featured-workshops/FeaturedWorkshopManager";

export default function FeaturedWorkshopsAdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Featured Workshop Section</h1>
      <FeaturedWorkshopManager />
    </div>
  );
}
