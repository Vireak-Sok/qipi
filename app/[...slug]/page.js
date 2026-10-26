import { notFound } from "next/navigation";
import HomePage from "../page.js";
import { isSupportedPage } from "../../public/js/route-config.js";

export default async function RoutedPage({ params }) {
  const { slug } = await params;
  if (!isSupportedPage(slug)) notFound();
  return <HomePage />;
}
