import { createContext, useContext, useState, ReactNode, FC, useEffect } from 'react';
import tutorialData from '../data/tutorialSteps.json';

interface TutorialContextType {
  showTuto: boolean;
  setShowTuto: (show: boolean) => void;
  currentStep: TutorialStep;
  setCurrentStep: (step: TutorialStep) => void;
  nextStep: () => void;
}

type TutorialStep = string;

const tutorialSteps: string[] = Object.keys(tutorialData);

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  console.log('context', context);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: FC<TutorialProviderProps> = ({ children }) => {
  const [showTuto, setShowTuto] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<TutorialStep>('1');

  const completeTutorial = () => {
    localStorage.setItem('tutorialCompleted', 'true');
    setShowTuto(false); // Cache le tutoriel
  };

  const nextStep = () => {
    const currentIndex = tutorialSteps.indexOf(currentStep);
    const nextIndex = (currentIndex + 1) % tutorialSteps.length; // Cela permet de revenir au début après la dernière étape
    setCurrentStep(tutorialSteps[nextIndex]);
    if (currentStep === tutorialSteps[tutorialSteps.length - 1]) {
      completeTutorial();
    }
  };

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (tutorialCompleted === 'true') {
      setShowTuto(false); // Ne montre pas le tutoriel si déjà complété
    } else {
      setShowTuto(true); // Montre le tutoriel si non complété
    }
  }, []);

  return (
    <TutorialContext.Provider value={{ showTuto, setShowTuto, currentStep, setCurrentStep, nextStep }}>
      {children}
    </TutorialContext.Provider>
  );
};
