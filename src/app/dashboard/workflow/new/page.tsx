import { redirect } from "next/navigation";

export default function NewWorkflowPage() {
  // In the future, this will create a new workflow in the DB
  // and redirect to the editor with the new ID
  
  // For now, just redirect to a demo workflow
  redirect("/dashboard/workflow/new-workflow");
}
