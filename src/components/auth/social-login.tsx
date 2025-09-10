"use client"

import { useState } from "react"
import { auth } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Github } from "lucide-react"

interface SocialLoginProps {
  onError?: (error: string) => void
}

export default function SocialLogin({ onError }: SocialLoginProps) {
  const [loading, setLoading] = useState<"google" | "github" | null>(null)

  const handleSocialLogin = async (provider: "google" | "github") => {
    setLoading(provider)
    
    try {
      const { error } = provider === "google" 
        ? await auth.signInWithGoogle()
        : await auth.signInWithGitHub()
      
      if (error) throw error
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      onError?.(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-white dark:bg-gray-800 px-4 text-gray-500 dark:text-gray-400 font-medium">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          onClick={() => handleSocialLogin("google")}
          disabled={loading !== null}
          className="w-full h-12 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
        >
          {loading === "google" ? (
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          ) : (
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span className="font-medium">Continue with Google</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleSocialLogin("github")}
          disabled={loading !== null}
          className="w-full h-12 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
        >
          {loading === "github" ? (
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          ) : (
            <Github className="mr-3 h-5 w-5" />
          )}
          <span className="font-medium">Continue with GitHub</span>
        </Button>
      </div>
    </div>
  )
}
