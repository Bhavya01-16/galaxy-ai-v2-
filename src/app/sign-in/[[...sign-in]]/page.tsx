import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
            card: "bg-gray-900 border border-gray-800",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-gray-800 border-gray-700 text-white",
            footerActionLink: "text-purple-400 hover:text-purple-300",
          },
        }}
      />
    </main>
  );
}
