export function next() {
  const slider = document.querySelector("#slider") as HTMLDivElement;
  let sliderSection = document.querySelectorAll(
    ".portfolio-carrousel__item"
  ) as NodeListOf<HTMLDivElement>;
  let sliderSectionFirst = sliderSection[0];
  slider.style.marginLeft = "-200%";
  slider.style.transition = "all 0.5s";
  setTimeout(() => {
    slider.style.transition = "none";
    slider.insertAdjacentElement("beforeend", sliderSectionFirst);
    slider.style.marginLeft = "-100%";
  }, 500);
}

export function prev() {
  const slider = document.querySelector("#slider") as HTMLDivElement;
  let sliderSection = document.querySelectorAll(
    ".portfolio-carrousel__item"
  ) as NodeListOf<HTMLDivElement>;
  let sliderSectionLength = sliderSection.length;
  let sliderSectionLast = sliderSection[sliderSectionLength - 1];
  slider.style.marginLeft = "0";
  slider.style.transition = "all 0.5s";
  setTimeout(() => {
    slider.style.transition = "none";
    slider.insertAdjacentElement("afterbegin", sliderSectionLast);
    slider.style.marginLeft = "-100%";
  }, 500);
}