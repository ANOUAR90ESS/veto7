
import React, { useState, useEffect, useRef } from 'react';
import { Tool, Slide, TutorialSection, Course } from '../types';
import { X, FileText, MonitorPlay, BookOpen, Loader2, CheckCircle, XCircle, Lightbulb, GraduationCap, Play, Sparkles } from 'lucide-react';
import { generateToolSlides, generateToolTutorial, generateFullCourse } from '../services/geminiService';
import { CoursePlayer } from './CoursePlayer';

interface ToolInsightModalProps {
  tool: Tool;
  initialTab?: 'summary' | 'slides' | 'tutorial';
  onClose: () => void;
  onUpdateTool?: (id: string, tool: Tool) => void;
}

const ToolInsightModal: React.FC<ToolInsightModalProps> = ({ tool, initialTab = 'summary', onClose, onUpdateTool }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'slides' | 'tutorial' | 'course'>(initialTab);
  
  // Initialize with saved data if available
  const [slides, setSlides] = useState<Slide[]>(tool.slides || []);
  const [tutorialContent, setTutorialContent] = useState<TutorialSection[]>(tool.tutorial || []);
  const [course, setCourse] = useState<Course | null>(tool.course || null);
  
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const [isPlayingCourse, setIsPlayingCourse] = useState(false);

  // Initial Load
  useEffect(() => {
      if (!hasLoadedRef.current) {
          handleTabChange(initialTab as any);
          hasLoadedRef.current = true;
      }
  }, [initialTab]);

  const handleTabChange = async (tab: 'summary' | 'slides' | 'tutorial' | 'course') => {
    setActiveTab(tab);
    
    // Only generate if data is missing from both prop and state
    if (tab === 'slides' && slides.length === 0) {
      setLoading(true);
      try {
        const generatedSlides = await generateToolSlides(tool);
        if (!generatedSlides || generatedSlides.length === 0) {
          throw new Error("No slides were generated");
        }
        setSlides(generatedSlides);
        // Automatically save to database if handler provided
        if (onUpdateTool) {
            onUpdateTool(tool.id, { ...tool, slides: generatedSlides });
        }
      } catch (e: any) {
        console.error("Slides generation error:", e);
        alert("Failed to generate slides: " + (e.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    } else if (tab === 'tutorial' && tutorialContent.length === 0) {
      setLoading(true);
      try {
        const courseContent = await generateToolTutorial(tool);
        if (!courseContent || courseContent.length === 0) {
          throw new Error("No tutorial content was generated");
        }
        setTutorialContent(courseContent);
        // Automatically save to database if handler provided
        if (onUpdateTool) {
            onUpdateTool(tool.id, { ...tool, tutorial: courseContent });
        }
      } catch (e: any) {
        console.error("Tutorial generation error:", e);
        alert("Failed to generate tutorial: " + (e.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerateCourse = async () => {
      setLoading(true);
      try {
          const generatedCourse = await generateFullCourse(tool);
          if (!generatedCourse || !generatedCourse.modules || generatedCourse.modules.length === 0) {
              throw new Error("Generated course is empty or invalid");
          }
          setCourse(generatedCourse);
          // Automatically save to database if handler provided
          if (onUpdateTool) {
              onUpdateTool(tool.id, { ...tool, course: generatedCourse });
          }
      } catch (e: any) {
          console.error("Course generation error:", e);
          alert("Failed to generate course: " + (e.message || "Unknown error"));
      } finally {
          setLoading(false);
      }
  };

  if (isPlayingCourse && course) {
      return <CoursePlayer course={course} onExit={() => setIsPlayingCourse(false)} />;
  }
  
  if (isPlayingCourse && !course) {
      return (
          <div className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center">
              <div className="text-center">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                  <p className="text-white text-lg">Loading course...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">AI Insights</span>
            {tool.name}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-zinc-800 bg-zinc-950 shrink-0 overflow-x-auto">
          <button 
            onClick={() => handleTabChange('summary')}
            className={`flex-1 min-w-[100px] py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'summary' ? 'text-white border-indigo-500 bg-zinc-900' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
          >
            <FileText className="w-4 h-4" /> Summary
          </button>
          <button 
            onClick={() => handleTabChange('slides')}
            className={`flex-1 min-w-[100px] py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'slides' ? 'text-white border-indigo-500 bg-zinc-900' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
          >
            <MonitorPlay className="w-4 h-4" /> Slides
          </button>
          <button 
            onClick={() => handleTabChange('tutorial')}
            className={`flex-1 min-w-[100px] py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'tutorial' ? 'text-white border-indigo-500 bg-zinc-900' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
          >
            <BookOpen className="w-4 h-4" /> Tutorial
          </button>
          <button 
            onClick={() => handleTabChange('course')}
            className={`flex-1 min-w-[100px] py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'course' ? 'text-white border-indigo-500 bg-zinc-900' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
          >
            <GraduationCap className="w-4 h-4" /> Course
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-zinc-900/50 custom-scrollbar min-h-[400px]">
           {activeTab === 'summary' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in">
               <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                 <h4 className="text-sm font-semibold text-zinc-400 uppercase mb-2">About the Tool</h4>
                 <p className="text-lg text-white leading-relaxed">{tool.description}</p>
                 
                 {tool.howToUse && (
                    <div className="mt-4 pt-4 border-t border-zinc-700/50">
                        <h5 className="text-xs font-bold text-indigo-400 uppercase mb-1">Quick Start</h5>
                        <p className="text-sm text-zinc-300">{tool.howToUse}</p>
                    </div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-zinc-800/30 p-4 rounded-xl">
                   <h5 className="text-xs text-zinc-500 uppercase mb-1">Category</h5>
                   <p className="text-indigo-400 font-medium">{tool.category}</p>
                 </div>
                 <div className="bg-zinc-800/30 p-4 rounded-xl">
                   <h5 className="text-xs text-zinc-500 uppercase mb-1">Pricing</h5>
                   <p className="text-green-400 font-medium">{tool.price}</p>
                 </div>
               </div>

               {/* Detailed Features & Use Cases if available */}
               {(tool.features && tool.features.length > 0) && (
                   <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                       <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                           <Lightbulb className="w-4 h-4 text-yellow-500" /> Key Features
                       </h5>
                       <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           {tool.features.map((feature, idx) => (
                               <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                   {feature}
                               </li>
                           ))}
                       </ul>
                   </div>
               )}

               {/* Pros & Cons Grid */}
               {((tool.pros && tool.pros.length > 0) || (tool.cons && tool.cons.length > 0)) && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {tool.pros && tool.pros.length > 0 && (
                           <div className="bg-emerald-900/10 border border-emerald-900/30 p-4 rounded-xl">
                               <h5 className="text-xs font-bold text-emerald-500 uppercase mb-2 flex items-center gap-1">
                                   <CheckCircle className="w-3 h-3" /> Pros
                               </h5>
                               <ul className="space-y-1">
                                   {tool.pros.map((pro, i) => (
                                       <li key={i} className="text-sm text-zinc-300">• {pro}</li>
                                   ))}
                               </ul>
                           </div>
                       )}
                       {tool.cons && tool.cons.length > 0 && (
                           <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
                               <h5 className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-1">
                                   <XCircle className="w-3 h-3" /> Cons
                               </h5>
                               <ul className="space-y-1">
                                   {tool.cons.map((con, i) => (
                                       <li key={i} className="text-sm text-zinc-300">• {con}</li>
                                   ))}
                               </ul>
                           </div>
                       )}
                   </div>
               )}
             </div>
           )}

           {activeTab === 'slides' && (
             <div className="h-full flex flex-col">
               {loading ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
                   <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                   Generating presentation...
                 </div>
               ) : slides.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
                   <MonitorPlay className="w-12 h-12 text-zinc-700" />
                   <p>No slides available. Click the tab to generate.</p>
                 </div>
               ) : (
                 <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in">
                   {slides.map((slide, i) => (
                     <div key={i} className="bg-white text-black p-6 rounded-lg shadow-xl border border-zinc-200">
                       <h2 className="text-2xl font-bold mb-4 text-indigo-700">{slide.title}</h2>
                       <ul className="list-disc pl-5 space-y-2">
                         {slide.content.map((point, j) => (
                           <li key={j} className="text-lg text-zinc-800">{point}</li>
                         ))}
                       </ul>
                       <div className="mt-4 text-right text-xs text-zinc-400">Slide {i + 1}</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}

           {activeTab === 'tutorial' && (
             <div className="h-full flex flex-col">
               {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm">Generating illustrated tutorial...</p>
                    <p className="text-xs text-zinc-600">This may take a moment</p>
                  </div>
               ) : tutorialContent.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
                    <BookOpen className="w-12 h-12 text-zinc-700" />
                    <p>No tutorial available. Click the tab to generate.</p>
                  </div>
               ) : (
                  <div className="space-y-8 animate-in slide-in-from-bottom-2 fade-in">
                      <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl flex items-start gap-3">
                        <BookOpen className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold text-indigo-300">Quick-Start AI Tutorial</h4>
                            <p className="text-sm text-indigo-200/70">A visual guide to mastering {tool.name}.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        {tutorialContent.map((section, idx) => (
                            <div key={idx} className="bg-black/20 rounded-xl overflow-hidden border border-zinc-800">
                                <div className="h-48 w-full relative">
                                    <img src={section.imageUrl} alt={section.title} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white border border-white/10">
                                        Step {idx + 1}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-white mb-2">{section.title}</h3>
                                    <p className="text-zinc-300 leading-relaxed text-sm">{section.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
               )}
             </div>
           )}

           {activeTab === 'course' && (
               <div className="h-full flex flex-col">
                   {!course ? (
                       <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                           <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                               <GraduationCap className="w-10 h-10 text-white" />
                           </div>
                           <div>
                               <h3 className="text-2xl font-bold text-white mb-2">Deep Dive AI Course</h3>
                               <p className="text-zinc-400 max-w-sm mx-auto">
                                   Generate a comprehensive, interactive course with modules, quizzes, and practical exercises for {tool.name}.
                               </p>
                           </div>
                           <button 
                               onClick={handleGenerateCourse}
                               disabled={loading}
                               className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-transform active:scale-95 disabled:opacity-70 disabled:scale-100 flex items-center gap-2"
                           >
                               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-indigo-600" />}
                               {loading ? 'Designing Curriculum...' : 'Generate Course'}
                           </button>
                           {loading && <p className="text-xs text-zinc-500 animate-pulse">Using Gemini 2.5 Flash to structure learning path...</p>}
                       </div>
                   ) : !course.modules || course.modules.length === 0 ? (
                       <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                           <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                           <h3 className="text-xl font-bold text-white mb-2">Course Generation Failed</h3>
                           <p className="text-zinc-400 mb-6">The course content could not be generated properly.</p>
                           <button 
                               onClick={() => { setCourse(null); handleGenerateCourse(); }}
                               className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                           >
                               Try Again
                           </button>
                       </div>
                   ) : (
                       <div className="space-y-6 animate-in fade-in">
                           <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                               <h3 className="text-2xl font-bold text-white mb-2">{course.title}</h3>
                               <div className="flex gap-4 text-sm text-zinc-400 mb-6">
                                   <span>{course.modules.length} Modules</span>
                                   <span>~{course.totalDurationHours} Hours</span>
                               </div>
                               <button 
                                   onClick={() => {
                                       if (course && course.modules && course.modules.length > 0) {
                                           setIsPlayingCourse(true);
                                       } else {
                                           alert("Course content is not available. Please try regenerating the course.");
                                       }
                                   }}
                                   className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                               >
                                   <Play className="w-5 h-5 fill-current" /> Start Learning
                               </button>
                           </div>
                           
                           <div>
                               <h4 className="text-sm font-bold text-zinc-500 uppercase mb-3">Curriculum</h4>
                               <div className="space-y-2">
                                   {course.modules.map((mod, i) => (
                                       <div key={i} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex justify-between items-center">
                                           <div>
                                               <div className="text-xs text-indigo-400 font-bold mb-1">MODULE {i+1}</div>
                                               <div className="text-white font-medium">{mod.title}</div>
                                           </div>
                                           <div className="text-xs text-zinc-500">{mod.lessons.length} Lessons</div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ToolInsightModal;
