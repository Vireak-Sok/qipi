import { pageRegions, shellRegions } from "./regions.mjs";

// Each region is an isolated ownership boundary for the existing DOM controller.
// Keep these server components static; do not reconcile controller-owned children.
export function PageSurface({ region }) {
  const Tag = region.tag;
  return <Tag {...region.props} dangerouslySetInnerHTML={{ __html: region.html }} />;
}
export function QipiShell() {
  const { skipLink, topbar, leftRail, rightRail, mobileSearch, mobileNav, dialogs, toast } = shellRegions;
  return <>
    <PageSurface region={skipLink} />
    <PageSurface region={topbar} />
    <div className="app-layout shell" id="main">
      <PageSurface region={leftRail} />
      <main className="feed-column" id="feed">{pageRegions.map(region => <PageSurface key={region.props.id || region.props.className} region={region} />)}</main>
      <PageSurface region={rightRail} />
    </div>
    <PageSurface region={mobileSearch} />
    <PageSurface region={mobileNav} />
    {dialogs.map(region => <PageSurface key={region.props.id} region={region} />)}
    <PageSurface region={toast} />
  </>;
}
