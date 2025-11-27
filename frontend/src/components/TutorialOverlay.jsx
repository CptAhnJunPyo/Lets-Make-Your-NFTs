import { useState, useEffect } from 'react';

const tutorialSteps = [
  {
    id: 'welcome',
    title: '🎉 Welcome to CertiFi!',
    content: 'Create, manage and verify blockchain certificates easily. Let\'s take a quick tour!',
    target: null,
    position: 'center'
  },
  {
    id: 'connect-wallet',
    title: '🔗 Connect Your Wallet',
    content: 'First, connect your MetaMask wallet to get started with blockchain certificates.',
    target: '.connect-wallet-btn',
    position: 'bottom'
  },
  {
    id: 'navigation',
    title: '🧭 Navigation Tabs',
    content: 'Use these tabs to navigate: Create certificates, view your Portfolio, or Verify documents.',
    target: '.nav-center',
    position: 'bottom'
  },
  {
    id: 'create-tab',
    title: '✨ Create Certificates',
    content: 'Click here to mint new blockchain certificates with metadata standards.',
    target: '[data-tab="mint"]',
    position: 'bottom'
  },
  {
    id: 'portfolio-tab',
    title: '📁 Your Portfolio',
    content: 'View and manage all your owned certificates here.',
    target: '[data-tab="portfolio"]',
    position: 'bottom'
  },
  {
    id: 'verify-tab',
    title: '🔍 Verify Documents',
    content: 'Upload any file to check if it exists as a verified certificate on blockchain.',
    target: '[data-tab="verify"]',
    position: 'bottom'
  },
  {
    id: 'theme-toggle',
    title: '🌙 Theme Toggle',
    content: 'Switch between light and dark mode for better viewing experience.',
    target: '.theme-toggle',
    position: 'bottom-left'
  },
  {
    id: 'complete',
    title: '🚀 You\'re Ready!',
    content: 'That\'s it! Start by connecting your wallet and creating your first certificate.',
    target: null,
    position: 'center'
  }
];

function TutorialOverlay({ isVisible, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);

  useEffect(() => {
    if (!isVisible) return;

    const step = tutorialSteps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target);
      setTargetElement(element);
    } else {
      setTargetElement(null);
    }
  }, [currentStep, isVisible]);

  if (!isVisible) return null;

  const currentStepData = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const getTooltipPosition = () => {
    if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = targetElement.getBoundingClientRect();
    const position = currentStepData.position;

    switch (position) {
      case 'bottom':
        return {
          top: rect.bottom + 20,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)'
        };
      case 'bottom-left':
        return {
          top: rect.bottom + 20,
          left: rect.left,
          transform: 'translateX(-20%)'
        };
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  return (
    <div className="tutorial-overlay">
      {/* Highlight target element only */}
      {targetElement && (
        <div 
          className="tutorial-spotlight"
          style={{
            top: targetElement.getBoundingClientRect().top - 8,
            left: targetElement.getBoundingClientRect().left - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div 
        className="tutorial-tooltip"
        style={getTooltipPosition()}
      >
        <div className="tutorial-content">
          <h3 className="tutorial-title">{currentStepData.title}</h3>
          <p className="tutorial-text">{currentStepData.content}</p>
          
          <div className="tutorial-actions">
            <div className="tutorial-progress">
              <span>{currentStep + 1} / {tutorialSteps.length}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="tutorial-buttons">
              <button className="tutorial-btn secondary" onClick={handleSkip}>
                Skip Tour
              </button>
              <button className="tutorial-btn primary" onClick={handleNext}>
                {isLastStep ? 'Get Started!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;