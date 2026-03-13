"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepDef {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepDef[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav className="flex flex-col gap-0 w-[220px] flex-shrink-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isPending = index > currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="flex gap-3">
            {/* Vertical line + circle */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!isCompleted}
                onClick={isCompleted && onStepClick ? () => onStepClick(index) : undefined}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors flex-shrink-0",
                  isCompleted &&
                    "bg-primary border-primary text-primary-foreground cursor-pointer hover:bg-primary/90",
                  isActive && "border-primary text-primary bg-primary/10",
                  isPending && "border-muted-foreground/30 text-muted-foreground/50 bg-muted/20"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </button>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-8",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>

            {/* Label + description */}
            <div className="pt-1 pb-6">
              <p
                className={cn(
                  "text-sm font-medium leading-none",
                  isActive && "text-primary",
                  isPending && "text-muted-foreground/50"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
