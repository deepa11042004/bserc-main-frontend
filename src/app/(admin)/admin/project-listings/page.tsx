import ProjectListingsGrid from "@/components/admin/project-listings/ProjectListingsGrid";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Listings | BSERC Admin",
  description: "Manage project listings",
};

export default function ProjectListingsPage() {
  return <ProjectListingsGrid />;
}
