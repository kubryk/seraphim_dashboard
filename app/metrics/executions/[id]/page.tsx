import ExecutionDetails from "./ExecutionDetails";

export default async function ExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExecutionDetails executionId={id} />;
}
