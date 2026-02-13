export function Loading({ msg = "Loading" }: { msg?: string }) {
  return (
    <div className="flex items-center gap-2 my-5 mx-auto w-fit">
      <span>{msg}</span>
    </div>
  );
}
