import WorkflowEditor from "@/components/flow/WorkflowEditor";

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // For now, just pass the ID - later we'll fetch workflow data
  return <WorkflowEditor workflowId={id} />;
}
