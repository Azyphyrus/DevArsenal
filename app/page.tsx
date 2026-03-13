import HeroSection from "@/components/HeroSection"
import FeaturesSection from "@/components/FeaturesSection"
import { Footer } from "@/components/Footer"

export default function Home() {
  return (
    <div className="p-10">
      <HeroSection />
      <FeaturesSection/>
      <Footer/>
    </div>
  )
}
