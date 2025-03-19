export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center m-auto h-[80vh]">{children}</div>
  );
}
