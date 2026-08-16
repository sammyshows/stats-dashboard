import Nav from './Nav'

export default function Layout({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="elora-root h-full flex flex-col overflow-hidden">
      <Nav />
      <main className="grow flex flex-col min-h-0 overflow-y-auto elora-scroll">{children}</main>
    </div>
  )
}