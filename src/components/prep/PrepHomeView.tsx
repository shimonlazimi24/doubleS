import { PrepCourseCatalog } from "@/components/prep/catalog/PrepCourseCatalog";
import { PrepHomeCommunity } from "@/components/prep/home/PrepHomeCommunity";
import { PrepHomeHero } from "@/components/prep/home/PrepHomeHero";
import { PrepHomeValues } from "@/components/prep/home/PrepHomeValues";

export function PrepHomeView() {
  return (
    <>
      <PrepHomeHero />
      <PrepHomeValues />
      <PrepCourseCatalog id="limudim" />
      <PrepHomeCommunity />
    </>
  );
}
