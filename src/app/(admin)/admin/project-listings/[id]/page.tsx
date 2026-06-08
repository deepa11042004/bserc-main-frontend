import ProjectListingDetails from "@/components/admin/project-listings/ProjectListingDetails";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Listing Details | BSERC Admin",
  description: "View details of a project listing",
};

export default async function ProjectListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ProjectListingDetails id={resolvedParams.id} />;
}
