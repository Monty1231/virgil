"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "OAuthCallback":
        return "There was an issue with the Google sign-in process. This usually means the OAuth credentials are not properly configured.";
      case "AccessDenied":
        return "Your access request is pending approval. You will receive an email notification once your access has been granted.";
      case "Configuration":
        return "There is a problem with the server configuration. Please contact support.";
      case "OAuthSignin":
        return "There was an issue starting the Google sign-in process.";
      case "OAuthCreateAccount":
        return "There was an issue creating your account with Google.";
      default:
        return "An error occurred during authentication. Please try again.";
    }
  };

  const getErrorSolution = (error: string | null) => {
    switch (error) {
      case "OAuthCallback":
        return "Please check that your .env.local file has correct Google credentials";
      case "AccessDenied":
        return "Contact the administrator to request access to the platform.";
      default:
        return "Try refreshing the page or contact support if the issue persists.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <CardTitle className="text-xl">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>

          {error === "OAuthCallback" && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <strong>To fix this:</strong>
                <br />
                1. Check your .env.local file has correct Google credentials
                <br />
                2. Verify redirect URI in Google Cloud Console
                <br />
                3. Restart the development server
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p>Need help? Contact us at support@virgil.io</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
