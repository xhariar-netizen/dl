export function ErrorPage({ msg }: { msg: string }) {
  return <section className="w-fit my-5 mx-auto text-center md:text-lg lg:text-xl xl:text-2xl">{msg}</section>;
}
