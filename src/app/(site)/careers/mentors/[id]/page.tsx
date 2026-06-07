"use client";

import { ArrowLeft, Loader2, Briefcase, Star, Users, Clock, CreditCard, MessageCircle, Heart, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { MentorProfile } from "@/types/mentor";

function getInitial(name: string): string {
  const letter = name.trim().charAt(0).toUpperCase();
  return letter || "M";
}

interface TabType {
  id: "professional" | "expertise" | "mentoring" | "ratings";
  label: string;
  icon: React.ReactNode;
}

interface RatingData {
  average_rating: number | null;
  total_ratings: number;
}

interface UserRating {
  id?: number;
  rating?: number;
  review?: string;
}

interface MentorRating {
  id: number;
  user_name: string;
  rating: number;
  review: string | null;
  created_at: string;
}

interface NotificationMessage {
  type: "success" | "error";
  message: string;
}

export default function MentorDetailPage() {
  const params = useParams();
  const mentorId = params.id as string;
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"professional" | "expertise" | "mentoring" | "ratings">("professional");
  const [ratingData, setRatingData] = useState<RatingData>({ average_rating: null, total_ratings: 0 });
  const [ratings, setRatings] = useState<MentorRating[]>([]);
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMentor = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/mentor/${mentorId}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to fetch mentor details.");
        }

        const data = await response.json();

        if (!isMounted) {
          return;
        }

        const mentorData = data.mentor || data;
        if (mentorData && mentorData.id) {
          setMentor(mentorData as MentorProfile);
        } else {
          setError("Mentor not found.");
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setMentor(null);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Unable to fetch mentor details.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMentor();

    return () => {
      isMounted = false;
    };
  }, [mentorId]);

  useEffect(() => {
    if (!mentor) return;

    const fetchRatings = async () => {
      try {
        const [averageRes, ratingsRes] = await Promise.all([
          fetch(`/api/mentor/${mentorId}/rating/average`),
          fetch(`/api/mentor/${mentorId}/ratings`),
        ]);

        if (averageRes.ok) {
          const avgData = await averageRes.json();
          setRatingData(avgData);
        }

        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setRatings(ratingsData.ratings || []);
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
      }
    };

    fetchRatings();
  }, [mentor, mentorId]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRating || selectedRating < 2) {
      setNotification({
        type: "error",
        message: "Please provide a rating of at least 2 stars"
      });
      return;
    }

    if (!userEmail) {
      setNotification({
        type: "error",
        message: "Please provide your email"
      });
      return;
    }

    setSubmittingRating(true);

    try {
      const response = await fetch(`/api/mentor/${mentorId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: selectedRating,
          review: null,
          userName: userName || "Anonymous",
          userEmail,
        }),
      });

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Rating submitted successfully!"
        });
        
        // Clear form after 2 seconds
        setTimeout(() => {
          setShowRatingForm(false);
          setSelectedRating(0);
          setUserName("");
          setUserEmail("");
          setNotification(null);
        }, 2000);

        // Refresh ratings
        const [averageRes, ratingsRes] = await Promise.all([
          fetch(`/api/mentor/${mentorId}/rating/average`),
          fetch(`/api/mentor/${mentorId}/ratings`),
        ]);

        if (averageRes.ok) {
          const avgData = await averageRes.json();
          setRatingData(avgData);
        }

        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setRatings(ratingsData.ratings || []);
        }
      } else {
        setNotification({
          type: "error",
          message: "Failed to submit rating. Please try again."
        });
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
      setNotification({
        type: "error",
        message: "Error submitting rating. Please try again."
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  if (isLoading) {
    return (
      <section className="min-h-screen bg-[#0d0d0d] text-zinc-300 py-12 px-4">
        <div className="mx-auto w-full max-w-6xl">
          <Link
            href="/careers/mentors"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Mentors
          </Link>
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !mentor) {
    return (
      <section className="min-h-screen bg-[#0d0d0d] text-zinc-300 py-12 px-4">
        <div className="mx-auto w-full max-w-6xl">
          <Link
            href="/careers/mentors"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Mentors
          </Link>
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-6 py-8 text-center">
            <p className="text-rose-200">{error || "Mentor not found."}</p>
          </div>
        </div>
      </section>
    );
  }

  const tabs: TabType[] = [
    { id: "professional", label: "Professional Details", icon: <Briefcase className="w-4 h-4" /> },
    { id: "expertise", label: "Expertise & Specialization", icon: <Star className="w-4 h-4" /> },
    { id: "mentoring", label: "Mentoring Info", icon: <Users className="w-4 h-4" /> },
    { id: "ratings", label: "Ratings & Reviews", icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <section className="min-h-screen bg-[#0d0d0d] text-zinc-300 py-12 px-4">
      <div className="mx-auto w-full max-w-6xl">
        {/* Back Button */}
        <Link
          href="/careers/mentors"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Mentors
        </Link>

        {/* Hero Section with Profile */}
        <div className="rounded-2xl border border-zinc-700/70 bg-gradient-to-br from-zinc-900/70 to-zinc-900/40 p-8 mb-8 overflow-hidden relative">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Profile Photo */}
              <div className="mx-auto lg:mx-0 h-40 w-40 overflow-hidden rounded-2xl border-4 border-cyan-500/30 bg-zinc-800 shadow-[0_4px_14px_rgba(0,0,0,0.28)] flex-shrink-0">
                {mentor.has_profile_photo ? (
                  <img
                    src={`/api/mentor/${mentor.id}/profile-photo`}
                    alt={`${mentor.full_name} profile photo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl font-semibold text-zinc-100">
                    {getInitial(mentor.full_name)}
                  </div>
                )}
              </div>

              {/* Name and Title */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                  {mentor.full_name}
                </h1>
                <p className="text-xl text-zinc-300 mb-2">
                  {mentor.current_position || "Mentor"}
                </p>
                {mentor.organization && (
                  <p className="text-base text-zinc-400 mb-4">
                    {mentor.organization}
                  </p>
                )}
                
                {/* Rating Display */}
                <div className="flex flex-col gap-2 justify-center lg:justify-start mb-4">
                  {ratingData.average_rating !== null ? (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(ratingData.average_rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-zinc-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-yellow-400 font-semibold">
                        {ratingData.average_rating.toFixed(1)}
                      </span>
                      <span className="text-zinc-400 text-sm">
                        ({ratingData.total_ratings} ratings)
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {mentor.primary_track && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium">
                      <Star className="w-3.5 h-3.5" />
                      {mentor.primary_track}
                    </span>
                  )}
                  {mentor.years_experience !== null && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {mentor.years_experience}+ years
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 border-b border-zinc-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold uppercase tracking-wider transition-all duration-300 border-b-2 ${
                  activeTab === tab.id
                    ? "text-cyan-300 border-cyan-500"
                    : "text-zinc-400 border-transparent hover:text-zinc-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {/* Professional Details Tab */}
          {activeTab === "professional" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {mentor.organization && (
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <Briefcase className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-2">
                        Organization
                      </p>
                      <p className="text-white text-lg font-medium">{mentor.organization}</p>
                    </div>
                  </div>
                </div>
              )}
              {mentor.current_position && (
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <Briefcase className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-2">
                        Current Position
                      </p>
                      <p className="text-white text-lg font-medium">{mentor.current_position}</p>
                    </div>
                  </div>
                </div>
              )}
              {mentor.years_experience !== null && (
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-2">
                        Years of Experience
                      </p>
                      <p className="text-white text-lg font-medium">{mentor.years_experience}+ years</p>
                    </div>
                  </div>
                </div>
              )}
              {mentor.availability && (
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-2">
                        Availability
                      </p>
                      <p className="text-white text-lg font-medium">{mentor.availability}</p>
                    </div>
                  </div>
                </div>
              )}
              {mentor.professional_bio && (
                <div className="md:col-span-2 rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                  <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-4">
                    Professional Bio
                  </p>
                  <p className="text-zinc-300 leading-relaxed text-base whitespace-pre-wrap">
                    {mentor.professional_bio}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Expertise & Specialization Tab */}
          {activeTab === "expertise" && (
            <div className="space-y-6 animate-fadeIn">
              {mentor.primary_track && (
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-8 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <Star className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-3">
                        Primary Track
                      </p>
                      <p className="text-2xl text-cyan-300 font-bold">{mentor.primary_track}</p>
                    </div>
                  </div>
                </div>
              )}
              {mentor.key_competencies && (
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-8 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <Star className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-3">
                        Key Competencies
                      </p>
                      <p className="text-white leading-relaxed text-base">{mentor.key_competencies}</p>
                    </div>
                  </div>
                </div>
              )}
              {mentor.secondary_skills && (
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-8 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <Star className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-3">
                        Secondary Skills
                      </p>
                      <p className="text-white leading-relaxed text-base">{mentor.secondary_skills}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mentoring Info Tab */}
          {activeTab === "mentoring" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Availability Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-cyan-400" />
                    <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                      Max Students
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {(mentor as any).max_students || "N/A"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-6 h-6 text-blue-400" />
                    <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                      Session Duration
                    </p>
                  </div>
                  <p className="text-lg font-medium text-white">
                    {(mentor as any).session_duration || "N/A"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-6 h-6 text-green-400" />
                    <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                      Complimentary Session
                    </p>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {(mentor as any).complimentary_session ? "✓ Available" : "Not Available"}
                  </p>
                </div>
              </div>

              {/* Rates Section */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Available Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(mentor as any).honorarium_hourly && (
                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-6 h-6 text-purple-400" />
                        <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                          Hourly Rate
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-white">₹{(mentor as any).honorarium_hourly}</p>
                    </div>
                  )}
                  {(mentor as any).honorarium_daily && (
                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-6 h-6 text-indigo-400" />
                        <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                          Daily Rate
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-white">₹{(mentor as any).honorarium_daily}</p>
                    </div>
                  )}
                  {(mentor as any).honorarium_weekly && (
                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-6 h-6 text-pink-400" />
                        <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                          Weekly Rate
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-white">₹{(mentor as any).honorarium_weekly}</p>
                    </div>
                  )}
                  {(mentor as any).consultation_fee && (
                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-6 h-6 text-green-400" />
                        <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                          Consultation Fee
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-white">₹{(mentor as any).consultation_fee}</p>
                    </div>
                  )}
                  {(mentor as any).price_5_sessions && (
                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-6 h-6 text-yellow-400" />
                        <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                          5 Sessions Package
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-white">₹{(mentor as any).price_5_sessions}</p>
                    </div>
                  )}
                  {(mentor as any).price_10_sessions && (
                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-6 h-6 text-orange-400" />
                        <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                          10 Sessions Package
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-white">₹{(mentor as any).price_10_sessions}</p>
                    </div>
                  )}
                  {(mentor as any).price_extended && (
                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-6 h-6 text-red-400" />
                        <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                          Extended Package
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-white">₹{(mentor as any).price_extended}</p>
                    </div>
                  )}
                  {(mentor as any).honorarium_project && (
                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6 hover:border-zinc-600 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-6 h-6 text-cyan-400" />
                        <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                          Project Rate
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-white">₹{(mentor as any).honorarium_project}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Experience Section */}
              {(mentor as any).mentoring_experience && (
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-6">
                  <div className="flex items-start gap-4">
                    <Users className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-3">
                        Mentoring Experience
                      </p>
                      <p className="text-white leading-relaxed">
                        {(mentor as any).mentoring_experience}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ratings & Reviews Tab */}
          {activeTab === "ratings" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Rating Summary */}
              <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white mb-2">
                      {ratingData.average_rating !== null ? ratingData.average_rating.toFixed(1) : "N/A"}
                    </div>
                    <div className="flex justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            ratingData.average_rating !== null && star <= Math.round(ratingData.average_rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-zinc-600"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-zinc-400">
                      Based on {ratingData.total_ratings} rating{ratingData.total_ratings !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex-1">
                    <button
                      onClick={() => setShowRatingForm(!showRatingForm)}
                      className="w-full md:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      {showRatingForm ? "Cancel" : "Leave a Rating"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Message */}
              {notification && (
                <div className={`rounded-xl border px-6 py-4 flex items-start gap-3 animate-slideDown ${
                  notification.type === "success"
                    ? "bg-green-950/30 border-green-500/40"
                    : "bg-red-950/30 border-red-500/40"
                }`}>
                  {notification.type === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={notification.type === "success" ? "text-green-200" : "text-red-200"}>
                    {notification.message}
                  </p>
                </div>
              )}

              {/* Rating Form */}
              {showRatingForm && (
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Rate This Mentor</h3>
                  <form onSubmit={handleSubmitRating} className="space-y-6">
                    {/* User Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          required
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                          placeholder="Your name"
                        />
                      </div>
                    </div>

                    {/* Rating Stars */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-4">
                        Your Rating <span className="text-red-400">*</span>
                      </label>
                      <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => star >= 2 && setSelectedRating(star)}
                            disabled={star < 2}
                            className={`focus:outline-none transition-all ${
                              star < 2 ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:scale-110"
                            }`}
                          >
                            <Star
                              className={`w-10 h-10 ${
                                star <= selectedRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : star < 2
                                  ? "text-zinc-700"
                                  : "text-zinc-600 hover:text-yellow-400"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      {selectedRating < 2 && (
                        <p className="text-xs text-zinc-400 mt-2">Minimum rating is 2 stars</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submittingRating || selectedRating < 2}
                      className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      {submittingRating ? "Submitting..." : "Submit Rating"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}
