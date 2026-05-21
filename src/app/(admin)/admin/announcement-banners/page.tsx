import AnnouncementBannersManager from "@/components/admin/announcement-banners/AnnouncementBannersManager";

export default function AnnouncementBannersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Announcement Banners</h1>
      <AnnouncementBannersManager />
    </div>
  );
}
