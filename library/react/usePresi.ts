import React from "react";

export interface PresiSlideProps {
  title: string;
}

export interface PresiContextValue {
  slideIndex: number;
  stepIndex: number;
  totalSlides: number;
  totalSteps: number;
  currentSlide: PresiSlideProps;
}

export const PresiContext = React.createContext<PresiContextValue>({
  slideIndex: 0,
  stepIndex: 0,
  totalSlides: 0,
  totalSteps: 0,
  currentSlide: {
    title: "",
  },
});

const usePresi = (): PresiContextValue => React.useContext(PresiContext);

export default usePresi;
