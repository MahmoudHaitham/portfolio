import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import Contact from "@/components/sections/Contact";
import SectionDivider from "@/components/SectionDivider";

export default function Home() {
  return (
    <>
      <Hero />
      <SectionDivider variant="wave" />
      <About />
      <SectionDivider variant="particles" />
      <Skills />
      <SectionDivider variant="gradient" />
      <Experience />
      <SectionDivider variant="beam" />
      <Projects />
      <SectionDivider variant="mesh" />
      <Contact />
    </>
  );
}

