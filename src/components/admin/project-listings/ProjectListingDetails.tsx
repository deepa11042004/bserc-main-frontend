"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Download, Trash2, Calendar, Mail, Phone, MapPin, Building, Briefcase, Link as LinkIcon, BookOpen, GraduationCap, CheckCircle2, User } from "lucide-react";

import { AdminToast } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { ProjectListing, ProjectListingDetailResponse } from "@/types/project-listing";

export default function ProjectListingDetails({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadingDoc, setIsDownloadingDoc] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/project-listing/${id}`, {
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as any;

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load project listing.");
        }

        const detailResponse = payload as ProjectListingDetailResponse;
        setProject(detailResponse.data);
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : "Failed to load project listing.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/project-listing/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Failed to delete project listing.");
      }

      setToastVariant("success");
      setToastMessage("Project deleted successfully. Redirecting...");
      
      setTimeout(() => {
        router.push("/admin/project-listings");
      }, 1500);
    } catch (err) {
      setToastVariant("error");
      setToastMessage(err instanceof Error && err.message ? err.message : "Failed to delete.");
      setIsDeleting(false);
    }
  };

  const handleDownloadDoc = async () => {
    if (!project?.supporting_doc_path) return;
    
    setIsDownloadingDoc(true);
    try {
      const response = await fetch(`/api/project-listing/${id}/document-url`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Failed to get document URL.");
      }

      if (payload.url) {
        // Open the pre-signed URL in a new tab to download
        window.open(payload.url, "_blank");
      } else {
        throw new Error("Document URL not found in response.");
      }
    } catch (err) {
      setToastVariant("error");
      setToastMessage(err instanceof Error && err.message ? err.message : "Failed to download document.");
    } finally {
      setIsDownloadingDoc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="animate-pulse">Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6 max-w-4xl text-center">
        <div className="bg-rose-950/40 border border-rose-900 rounded-lg p-8">
          <p className="text-rose-400 mb-4">{error || "Project listing not found."}</p>
          <Link href="/admin/project-listings">
            <Button variant="outline" className="border-rose-800 text-rose-300 hover:bg-rose-900/50">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode, icon: any }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800">
      <Icon className="h-5 w-5 text-emerald-500" />
      <h3 className="text-lg font-semibold text-zinc-200">{children}</h3>
    </div>
  );

  const DetailRow = ({ label, value, isLink = false }: { label: string, value: any, isLink?: boolean }) => {
    if (value === null || value === undefined || value === "") return null;
    
    // Handle arrays (e.g. publication_type, collaborator_types)
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      value = value.join(", ");
    }

    return (
      <div className="mb-3">
        <span className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{label}</span>
        {isLink ? (
          <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline break-all text-sm flex items-center gap-1.5">
            <LinkIcon className="h-3.5 w-3.5" />
            {value}
          </a>
        ) : (
          <span className="text-zinc-300 text-sm whitespace-pre-wrap">{value}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <AdminToast
        open={Boolean(toastMessage)}
        message={toastMessage || ""}
        onClose={() => setToastMessage(null)}
        variant={toastVariant}
      />

      <div className="container mx-auto max-w-5xl py-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/project-listings">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-200">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project Listings
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-900/50 hover:bg-rose-800 text-rose-200 border border-rose-800/50"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{project.project_title}</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="bg-emerald-950/40 text-emerald-400 border-emerald-800/50">
              {project.project_theme.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="bg-blue-950/40 text-blue-400 border-blue-800/50">
              {project.project_level.toUpperCase()}
            </Badge>
            <span className="text-zinc-500 ml-2">
              Submitted on {new Date(project.created_at || "").toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
              <CardContent className="p-6">
                <SectionTitle icon={Briefcase}>Project Overview</SectionTitle>
                <div className="grid grid-cols-2 gap-4 mb-6 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                  <DetailRow label="Start Date" value={project.project_start_date} />
                  <DetailRow label="End Date" value={project.project_end_date || "Ongoing"} />
                  <DetailRow label="Theme" value={project.project_theme === 'other' ? project.project_theme_other : project.project_theme} />
                  <DetailRow label="Level" value={project.project_level} />
                </div>
                
                <DetailRow label="Objective" value={project.project_objective} />
                <DetailRow label="Methodology" value={project.project_methodology} />
                <DetailRow label="Outcome / Expected Impact" value={project.project_outcome} />
              </CardContent>
            </Card>

            {(project.synopsis_link || project.github_link || project.drive_link || project.demo_link || project.supporting_doc_path) && (
              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardContent className="p-6">
                  <SectionTitle icon={LinkIcon}>Resources & Links</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Synopsis Video" value={project.synopsis_link} isLink />
                    <DetailRow label="GitHub Repository" value={project.github_link} isLink />
                    <DetailRow label="Google Drive Folder" value={project.drive_link} isLink />
                    <DetailRow label="Live Demo" value={project.demo_link} isLink />
                    
                    {project.supporting_doc_path && (
                      <div className="sm:col-span-2 mt-2 pt-4 border-t border-zinc-800/50">
                        <span className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Supporting Document</span>
                        <Button 
                          onClick={handleDownloadDoc} 
                          disabled={isDownloadingDoc}
                          variant="outline" 
                          className="w-full sm:w-auto bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
                        >
                          {isDownloadingDoc ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-500" />
                          ) : (
                            <Download className="mr-2 h-4 w-4 text-emerald-500" />
                          )}
                          Download Document ({project.supporting_doc_file_name || "File"})
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {project.is_thesis_linked && (
              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardContent className="p-6">
                  <SectionTitle icon={BookOpen}>Thesis Details</SectionTitle>
                  <DetailRow label="Thesis Title" value={project.thesis_title} />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <DetailRow label="Degree" value={project.thesis_degree} />
                    <DetailRow label="Supervisor" value={project.thesis_supervisor} />
                    <DetailRow label="Institution" value={project.thesis_institution} />
                  </div>
                </CardContent>
              </Card>
            )}

            {(project.seeking_collaborators || project.open_to_funding) && (
              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardContent className="p-6">
                  <SectionTitle icon={User}>Collaboration & Support</SectionTitle>
                  <div className="space-y-6">
                    {project.seeking_collaborators && (
                      <div>
                        <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Actively Seeking Collaborators
                        </h4>
                        <div className="grid grid-cols-2 gap-4 ml-6 pl-4 border-l border-emerald-900/30">
                          <DetailRow label="Looking For" value={project.collaborator_types} />
                          <DetailRow label="Collaboration Type" value={project.collaboration_types} />
                          <DetailRow label="Other Details" value={project.collaboration_other} />
                          <div className="col-span-2">
                            <DetailRow label="Requirements" value={project.collaboration_requirements} />
                          </div>
                        </div>
                      </div>
                    )}

                    {project.open_to_funding && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Open to Funding/Support
                        </h4>
                        <div className="grid grid-cols-2 gap-4 ml-6 pl-4 border-l border-blue-900/30">
                          <DetailRow label="Support Type" value={project.funding_sources} />
                          <DetailRow label="Other Support Details" value={project.funding_other} />
                          <DetailRow label="Estimated Budget" value={project.estimated_budget} />
                          <div className="col-span-2">
                            <DetailRow label="Current Support (if any)" value={project.current_support} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {(project.is_registered || project.is_published) && (
              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardContent className="p-6">
                  <SectionTitle icon={Building}>Additional Claims</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.is_registered && (
                      <div className="bg-zinc-950/30 p-4 rounded-md border border-zinc-800/30">
                        <h4 className="text-sm font-medium text-zinc-300 mb-3 border-b border-zinc-800 pb-2">Registration Details</h4>
                        <DetailRow label="Portal" value={project.portal_name} />
                        <DetailRow label="Reg Number" value={project.registration_number} />
                        <DetailRow label="Reg Date" value={project.registration_date} />
                      </div>
                    )}
                    {project.is_published && (
                      <div className="bg-zinc-950/30 p-4 rounded-md border border-zinc-800/30">
                        <h4 className="text-sm font-medium text-zinc-300 mb-3 border-b border-zinc-800 pb-2">Publication Details</h4>
                        <DetailRow label="Type" value={project.publication_type} />
                        <DetailRow label="Title" value={project.publication_title} />
                        <DetailRow label="Venue" value={project.publication_venue} />
                        <DetailRow label="Date" value={project.publication_date} />
                        <DetailRow label="Link" value={project.publication_link} isLink />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
              <CardHeader className="bg-zinc-950/50 pb-4 border-b border-zinc-800/50">
                <CardTitle className="text-base text-emerald-400 flex items-center gap-2">
                  <User className="h-4 w-4" /> Submitter Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="mb-5 pb-5 border-b border-zinc-800/50">
                  <h3 className="font-semibold text-lg text-white">{project.full_name}</h3>
                  <p className="text-zinc-500 text-sm mt-1 flex items-center gap-1.5"><Badge variant="outline" className="text-[10px] h-5 bg-zinc-800 border-zinc-700">{project.enrolment_number}</Badge></p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-zinc-500 mt-0.5" />
                    <div>
                      <span className="block text-[10px] font-medium text-zinc-500 uppercase">Primary Email</span>
                      <a href={`mailto:${project.primary_email}`} className="text-zinc-300 text-sm hover:text-white transition-colors">{project.primary_email}</a>
                    </div>
                  </div>
                  
                  {project.alternative_email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-zinc-600 mt-0.5" />
                      <div>
                        <span className="block text-[10px] font-medium text-zinc-500 uppercase">Alt Email</span>
                        <a href={`mailto:${project.alternative_email}`} className="text-zinc-400 text-sm hover:text-white transition-colors">{project.alternative_email}</a>
                      </div>
                    </div>
                  )}

                  {project.whatsapp_number && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-zinc-500 mt-0.5" />
                      <div>
                        <span className="block text-[10px] font-medium text-zinc-500 uppercase">WhatsApp</span>
                        <span className="text-zinc-300 text-sm">{project.whatsapp_number}</span>
                      </div>
                    </div>
                  )}
                </div>

                {project.preferred_contact && project.preferred_contact.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-zinc-800/50">
                    <span className="block text-[10px] font-medium text-zinc-500 uppercase mb-2">Preferred Contact Method</span>
                    <div className="flex flex-wrap gap-2">
                      {project.preferred_contact.map((method) => (
                        <Badge key={method} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">{method}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
              <CardContent className="p-5">
                <SectionTitle icon={GraduationCap}>Institution</SectionTitle>
                <div className="space-y-3">
                  <DetailRow label="Institution Name" value={project.institution} />
                  <DetailRow label="Department" value={project.department} />
                  <DetailRow label="Programme" value={project.programme === 'other' ? project.programme_other : project.programme?.toUpperCase()} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
              <CardContent className="p-5">
                <SectionTitle icon={MapPin}>Location</SectionTitle>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-300">{project.address_line1}</p>
                  <p className="text-sm text-zinc-300">{project.city}, {project.state} {project.pin_code}</p>
                  <p className="text-sm text-zinc-400 mt-1">{project.country}</p>
                </div>
              </CardContent>
            </Card>

            {project.additional_remarks && (
              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardContent className="p-5">
                  <span className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Additional Remarks</span>
                  <p className="text-sm text-zinc-300 italic">"{project.additional_remarks}"</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
