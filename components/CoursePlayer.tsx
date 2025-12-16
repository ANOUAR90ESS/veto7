
import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { BookOpen, CheckCircle, Play, ChevronDown, Menu, BadgeCheck, Video, Link, Sparkles, X, AlertCircle, Info } from 'lucide-react';
import { generateSpeech, generateImage } from '../services/geminiService';

interface CoursePlayerProps {
  course: Course;
  onExit: () => void;
}

interface MediaCache {
  [key: number]: {
    audioUrl?: string;
    imageUrl?: string;
  };
}

// Simple Markdown Renderer component
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-bold mt-6 mb-3 text-zinc-200">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-white">{line.replace('## ', '')}</h2>;
      if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold mt-8 mb-6 text-white border-b border-zinc-800 pb-2">{line.replace('# ', '')}</h1>;
      
      // List items
      if (line.trim().startsWith('- ')) return <li key={index} className="ml-6 list-disc mb-2 text-zinc-300">{line.replace('- ', '')}</li>;
      if (line.trim().match(/^\d+\./)) return <li key={index} className="ml-6 list-decimal mb-2 text-zinc-300">{line.replace(/^\d+\.\s/, '')}</li>;

      // Paragraphs
      if (line.trim() === '') return <div key={index} className="h-4"></div>;
      
      // Bold Text formatting
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className="mb-3 text-zinc-300 leading-relaxed">
          {parts.map((part, i) => {
             if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
             }
             return part;
          })}
        </p>
      );
    });
  };

  return <div>{formatText(content)}</div>;
};

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, onExit }) => {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'lesson' | 'quiz' | 'exercises' | 'script' | 'resources'>('lesson');
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Media Generation State
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [mediaCache, setMediaCache] = useState<MediaCache>({});
  
  // Storage key based on course title
  const storageKey = `course_progress_${course.title.replace(/\s+/g, '_').toLowerCase()}`;

  // Track completed items
  const [completedItems, setCompletedItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  // Save progress
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(completedItems)));
  }, [completedItems, storageKey]);

  const activeModule = course.modules[activeModuleIndex];
  const activeLesson = activeModule?.lessons[activeLessonIndex];

  // Completion Helpers
  const getItemId = (type: 'lesson' | 'exercises' | 'quiz' | 'script', mIndex: number, lIndex?: number) => {
    return `${type}-${mIndex}-${lIndex !== undefined ? lIndex : ''}`;
  };

  const isCompleted = (type: 'lesson' | 'exercises' | 'quiz' | 'script', mIndex: number, lIndex?: number) => {
    return completedItems.has(getItemId(type, mIndex, lIndex));
  };

  const toggleItemCompletion = (type: 'lesson' | 'exercises' | 'quiz' | 'script', mIndex: number, lIndex?: number) => {
    const id = getItemId(type, mIndex, lIndex);
    const newSet = new Set(completedItems);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setCompletedItems(newSet);
  };

  const markAsComplete = (type: 'lesson' | 'exercises' | 'quiz', mIndex: number, lIndex?: number) => {
    const id = getItemId(type, mIndex, lIndex);
    const newSet = new Set(completedItems);
    newSet.add(id);
    setCompletedItems(newSet);
  };

  // Progress Calculations
  const getModuleStats = (mIndex: number) => {
     const module = course.modules[mIndex];
     const hasScript = !!module.videoScript;
     const total = module.lessons.length + 2 + (hasScript ? 1 : 0);
     let completed = 0;
     module.lessons.forEach((_, i) => {
         if (isCompleted('lesson', mIndex, i)) completed++;
     });
     if (isCompleted('exercises', mIndex)) completed++;
     if (isCompleted('quiz', mIndex)) completed++;
     if (hasScript && isCompleted('script', mIndex)) completed++;
     return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const getTotalProgress = () => {
      let total = 0;
      let completed = 0;
      course.modules.forEach((_, i) => {
          const stats = getModuleStats(i);
          total += stats.total;
          completed += stats.completed;
      });
      return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const handleLessonSelect = (mIndex: number, lIndex: number) => {
    setActiveModuleIndex(mIndex);
    setActiveLessonIndex(lIndex);
    setViewMode('lesson');
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    markAsComplete('quiz', activeModuleIndex);
  };

  const handleNext = () => {
    if (viewMode === 'script') {
        setActiveLessonIndex(0);
        setViewMode('lesson');
        return;
    }

    if (viewMode === 'lesson') {
        if (activeLessonIndex < activeModule.lessons.length - 1) {
            setActiveLessonIndex(prev => prev + 1);
        } else {
            setViewMode('exercises');
        }
    } else if (viewMode === 'exercises') {
        setViewMode('quiz');
        setQuizAnswers(new Array(activeModule.quiz.questions.length).fill(-1));
        setQuizSubmitted(false);
    } else if (viewMode === 'quiz') {
        if (activeModuleIndex < course.modules.length - 1) {
            const nextIndex = activeModuleIndex + 1;
            setActiveModuleIndex(nextIndex);
            setActiveLessonIndex(0);
            setViewMode(course.modules[nextIndex].videoScript ? 'script' : 'lesson');
        } else {
            alert("Course Completed! Congratulations.");
        }
    } else if (viewMode === 'resources') {
         setViewMode('lesson');
    }
  };

  const handleGenerateVideo = async () => {
    if (isGeneratingMedia) return;
    if (mediaCache[activeModuleIndex]) return;

    setIsGeneratingMedia(true);
    try {
      // 1. Generate Audio
      const script = activeModule.videoScript || activeModule.overview;
      const audioRes = await generateSpeech(script);
      const audioBase64 = audioRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      let audioUrl = '';
      if (audioBase64) {
          const binary = atob(audioBase64);
          const array = new Uint8Array(binary.length);
          for(let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
          const blob = new Blob([array], { type: 'audio/wav' });
          audioUrl = URL.createObjectURL(blob);
      }

      // 2. Generate Thumbnail (using generateImage from geminiService)
      const prompt = `Futuristic educational illustration for course module: ${course.title} - ${activeModule.title}. High quality, abstract, tech style.`;
      const imgRes = await generateImage(prompt, "16:9", "1K");
      let imageUrl = '';
      const imgData = imgRes.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (imgData) {
          imageUrl = `data:image/png;base64,${imgData}`;
      }

      setMediaCache(prev => ({
        ...prev,
        [activeModuleIndex]: { audioUrl, imageUrl }
      }));

    } catch (error) {
      console.error("Failed to generate video elements", error);
      alert("Could not generate the video. Please try again.");
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-zinc-950 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950">
            <h2 className="font-bold text-lg text-white leading-tight mb-2 truncate" title={course.title}>{course.title}</h2>
            <div className="flex items-center text-xs text-zinc-500 mb-3">
               <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded mr-2">{course.modules.length} Modules</span>
               <span>{course.totalDurationHours}h Total</span>
            </div>
            
            {/* Overall Progress */}
            <div className="w-full">
                <div className="flex justify-between text-xs font-semibold text-zinc-500 mb-1">
                    <span>Course Progress</span>
                    <span>{getTotalProgress()}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${getTotalProgress()}%` }}></div>
                </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {course.modules.map((module, mIndex) => {
              const { percentage } = getModuleStats(mIndex);
              return (
              <div key={mIndex} className="border-b border-zinc-800">
                <button 
                  onClick={() => setActiveModuleIndex(mIndex === activeModuleIndex ? -1 : mIndex)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-zinc-900 transition-colors ${activeModuleIndex === mIndex ? 'bg-zinc-900' : ''}`}
                >
                  <div className="flex-1 pr-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-zinc-200 text-sm">Module {mIndex + 1}</span>
                        {percentage === 100 ? (
                            <BadgeCheck className="w-4 h-4 text-emerald-500" />
                        ) : (
                            <span className="text-[10px] text-zinc-500 font-medium">{percentage}%</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 truncate mb-1">{module.title}</div>
                      <div className="w-full bg-zinc-800 rounded-full h-1">
                        <div className={`h-1 rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${percentage}%` }}></div>
                      </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform ${activeModuleIndex === mIndex ? 'transform rotate-180' : ''}`} />
                </button>
                
                {activeModuleIndex === mIndex && (
                  <div className="bg-zinc-950 py-1">
                    {/* Video Script Item */}
                    {module.videoScript && (
                        <button
                            onClick={() => {
                                setActiveModuleIndex(mIndex);
                                setViewMode('script');
                            }}
                            className={`w-full text-left px-4 pl-6 py-2 text-sm flex items-center group transition-colors ${viewMode === 'script' && activeModuleIndex === mIndex ? 'bg-indigo-900/20 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                        >
                             <div className="mr-3 relative flex items-center justify-center w-5 h-5">
                                {isCompleted('script', mIndex) ? (
                                    <BadgeCheck className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Video className={`w-4 h-4 ${viewMode === 'script' && activeModuleIndex === mIndex ? 'text-indigo-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                                )}
                             </div>
                             <span className="truncate">Video Intro</span>
                        </button>
                    )}

                    {module.lessons.map((lesson, lIndex) => {
                      const completed = isCompleted('lesson', mIndex, lIndex);
                      return (
                      <button
                        key={lIndex}
                        onClick={() => handleLessonSelect(mIndex, lIndex)}
                        className={`w-full text-left px-4 pl-6 py-2 text-sm flex items-center group transition-colors ${activeLessonIndex === lIndex && viewMode === 'lesson' ? 'bg-indigo-900/20 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                      >
                         <div className="mr-3 relative flex items-center justify-center w-5 h-5">
                            {completed ? (
                                <BadgeCheck className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Play className={`w-4 h-4 ${activeLessonIndex === lIndex && viewMode === 'lesson' ? 'text-indigo-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                            )}
                         </div>
                         <span className={`truncate ${completed && activeLessonIndex !== lIndex ? 'text-zinc-600' : ''}`}>{lesson.title}</span>
                      </button>
                    )})}
                    <button
                        onClick={() => {
                            setActiveModuleIndex(mIndex);
                            setViewMode('exercises');
                        }}
                        className={`w-full text-left px-4 pl-6 py-2 text-sm flex items-center group transition-colors ${viewMode === 'exercises' && activeModuleIndex === mIndex ? 'bg-indigo-900/20 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                         <div className="mr-3 relative flex items-center justify-center w-5 h-5">
                             {isCompleted('exercises', mIndex) ? (
                                 <BadgeCheck className="w-5 h-5 text-emerald-500" />
                             ) : (
                                 <BookOpen className={`w-4 h-4 ${viewMode === 'exercises' && activeModuleIndex === mIndex ? 'text-indigo-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                             )}
                         </div>
                         Exercises
                    </button>
                    <button
                        onClick={() => {
                            setActiveModuleIndex(mIndex);
                            setViewMode('quiz');
                        }}
                        className={`w-full text-left px-4 pl-6 py-2 text-sm flex items-center group transition-colors ${viewMode === 'quiz' && activeModuleIndex === mIndex ? 'bg-indigo-900/20 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                         <div className="mr-3 relative flex items-center justify-center w-5 h-5">
                             {isCompleted('quiz', mIndex) ? (
                                 <BadgeCheck className="w-5 h-5 text-emerald-500" />
                             ) : (
                                 <CheckCircle className={`w-4 h-4 ${viewMode === 'quiz' && activeModuleIndex === mIndex ? 'text-indigo-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                             )}
                         </div>
                         Quiz
                    </button>
                  </div>
                )}
              </div>
            )})}
            
            {course.suggestedResources && course.suggestedResources.length > 0 && (
                 <div className="border-b border-zinc-800">
                    <button 
                        onClick={() => {
                            setActiveModuleIndex(-1);
                            setViewMode('resources');
                            setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center hover:bg-zinc-900 transition-colors ${viewMode === 'resources' ? 'bg-indigo-900/20 text-indigo-400' : 'text-zinc-400'}`}
                    >
                        <Link className={`w-5 h-5 mr-2 ${viewMode === 'resources' ? 'text-indigo-500' : 'text-zinc-600'}`} />
                        <span className="font-medium text-sm">Suggested Resources</span>
                    </button>
                 </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-950">
            <button 
              onClick={onExit}
              className="w-full py-2 text-sm text-zinc-400 hover:text-white font-medium border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Exit Course
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-zinc-800 bg-zinc-950 shadow-sm z-10">
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-3">
             <Menu className="w-6 h-6 text-zinc-400" />
           </button>
           <h1 className="font-semibold text-white truncate">
               {viewMode === 'lesson' ? activeLesson?.title : 
                viewMode === 'quiz' ? 'Module Quiz' : 
                viewMode === 'exercises' ? 'Practical Exercises' :
                viewMode === 'script' ? 'Video Script' : 'Resources'}
           </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-12 bg-black scroll-smooth">
          <div className="max-w-3xl mx-auto pb-20">
            {viewMode === 'resources' && (
                 <div className="animate-in fade-in slide-in-from-bottom-2">
                    <h1 className="text-3xl font-extrabold text-white mb-6">Suggested Resources</h1>
                    <p className="text-zinc-400 mb-8">Expand your knowledge with these curated materials.</p>
                    <div className="space-y-4">
                        {course.suggestedResources.map((res, idx) => (
                            <div key={idx} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 flex items-start">
                                <Link className="w-5 h-5 text-indigo-500 mt-1 mr-3 flex-shrink-0" />
                                <a href={res.includes('http') ? res : '#'} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-indigo-400 transition-colors break-all">{res}</a>
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            {viewMode === 'script' && activeModule && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-indigo-400 tracking-wider uppercase block">Module Intro</span>
                         {isCompleted('script', activeModuleIndex) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                                <BadgeCheck className="w-3 h-3 mr-1" /> Read
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-6">{activeModule.title} - Video Script</h1>
                    
                    {/* Video Player Section */}
                    {mediaCache[activeModuleIndex] ? (
                       <div className="mb-8 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-black relative aspect-video group">
                          {/* Image Layer */}
                          <img 
                            src={mediaCache[activeModuleIndex].imageUrl} 
                            alt={activeModule.title} 
                            className="w-full h-full object-cover opacity-90"
                          />
                          
                          {/* Audio Player Layer - custom controls overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex items-center justify-center">
                             <audio 
                                controls 
                                src={mediaCache[activeModuleIndex].audioUrl} 
                                className="w-full h-10 accent-indigo-500"
                                autoPlay
                             />
                          </div>
                          
                          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-xs backdrop-blur-sm border border-white/10">
                             AI Generated Video Summary
                          </div>
                       </div>
                    ) : (
                       <div className="mb-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
                          <div className="w-16 h-16 bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                             <Video className="w-8 h-8 text-indigo-500" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Generate Video Summary</h3>
                          <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                             Use Gemini AI to create a short narrated video summary of this module with a generated illustration.
                          </p>
                          <button
                             onClick={handleGenerateVideo}
                             disabled={isGeneratingMedia}
                             className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                             {isGeneratingMedia ? (
                                <>
                                  <Sparkles className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                  Creating Video...
                                </>
                             ) : (
                                <>
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  Generate AI Video
                                </>
                             )}
                          </button>
                       </div>
                    )}
                    
                    <div className="bg-zinc-900 text-zinc-300 p-8 rounded-xl font-mono text-sm leading-relaxed shadow-lg border border-zinc-800">
                        <div className="flex items-center text-zinc-500 mb-4 border-b border-zinc-800 pb-2">
                             <Video className="w-4 h-4 mr-2" />
                             <span>SCRIPT - 30-45s</span>
                        </div>
                        <SimpleMarkdown content={activeModule.videoScript || "No script available."} />
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => toggleItemCompletion('script', activeModuleIndex)}
                        className={`flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            isCompleted('script', activeModuleIndex)
                            ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' 
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                         {isCompleted('script', activeModuleIndex) ? "Marked as Read" : "Mark as Read"}
                      </button>
                    </div>
                </div>
            )}

            {viewMode === 'lesson' && activeLesson && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                  <article className="prose prose-invert lg:prose-lg max-w-none">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-indigo-400 tracking-wider uppercase block">Lesson {activeLessonIndex + 1}</span>
                        {isCompleted('lesson', activeModuleIndex, activeLessonIndex) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                                <BadgeCheck className="w-3 h-3 mr-1" /> Completed
                            </span>
                        )}
                     </div>
                     <h1 className="text-3xl font-extrabold text-white mb-6">{activeLesson.title}</h1>
                     <div className="text-zinc-500 mb-8 flex items-center space-x-2">
                        <span className="bg-zinc-900 px-2 py-1 rounded text-xs border border-zinc-800">{activeLesson.durationMinutes} mins read</span>
                     </div>
                     <SimpleMarkdown content={activeLesson.content} />
                  </article>
                  
                  <div className="mt-12 pt-8 border-t border-zinc-800 flex items-center justify-end">
                      <button
                        onClick={() => toggleItemCompletion('lesson', activeModuleIndex, activeLessonIndex)}
                        className={`flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-all transform active:scale-95 ${
                            isCompleted('lesson', activeModuleIndex, activeLessonIndex)
                            ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' 
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                         {isCompleted('lesson', activeModuleIndex, activeLessonIndex) ? (
                             <>
                                <BadgeCheck className="w-5 h-5 mr-2" />
                                Lesson Completed
                             </>
                         ) : (
                             <>
                                <div className="w-4 h-4 rounded-full border-2 border-zinc-500 mr-2"></div>
                                Mark as Complete
                             </>
                         )}
                      </button>
                  </div>
              </div>
            )}

            {viewMode === 'exercises' && activeModule && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-extrabold text-white mb-2">Practical Exercises</h1>
                        {isCompleted('exercises', activeModuleIndex) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                                <BadgeCheck className="w-3 h-3 mr-1" /> Completed
                            </span>
                        )}
                    </div>
                    <p className="text-zinc-400 mb-8">Apply what you've learned in this module.</p>
                    
                    {activeModule.practicalExercises.map((exercise, idx) => (
                        <div key={idx} className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <BookOpen className="w-24 h-24 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-indigo-300 mb-2 relative z-10">Exercise {idx + 1}</h3>
                            <p className="text-zinc-300 relative z-10">{exercise}</p>
                        </div>
                    ))}

                    <div className="mt-12 pt-8 border-t border-zinc-800 flex items-center justify-end">
                      <button
                        onClick={() => toggleItemCompletion('exercises', activeModuleIndex)}
                        className={`flex items-center px-6 py-3 rounded-lg border text-sm font-medium transition-all transform active:scale-95 ${
                            isCompleted('exercises', activeModuleIndex)
                            ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' 
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                         {isCompleted('exercises', activeModuleIndex) ? (
                             <>
                                <BadgeCheck className="w-5 h-5 mr-2" />
                                Exercises Completed
                             </>
                         ) : (
                             <>
                                <div className="w-4 h-4 rounded-full border-2 border-zinc-500 mr-2"></div>
                                Mark Exercises as Complete
                             </>
                         )}
                      </button>
                    </div>
                </div>
            )}

            {viewMode === 'quiz' && activeModule && (
              <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Knowledge Check</h1>
                    <p className="text-zinc-500">Test your understanding of {activeModule.title}</p>
                    {isCompleted('quiz', activeModuleIndex) && (
                         <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                            <BadgeCheck className="w-4 h-4 mr-1" /> Quiz Completed
                         </div>
                    )}
                </div>

                <div className="space-y-8">
                  {activeModule.quiz.questions.map((q, qIdx) => {
                    const isCorrectAnswer = quizAnswers[qIdx] === q.correctAnswerIndex;
                    
                    return (
                    <div key={qIdx} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 shadow-sm relative">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <div className="text-xs font-mono text-zinc-500 mb-1">
                                  Q{qIdx + 1} • {q.type === 'true-false' ? 'True/False' : 'Multiple Choice'}
                              </div>
                              <h3 className="font-semibold text-lg text-white pr-6">{q.question}</h3>
                          </div>
                      </div>
                      
                      {q.type === 'true-false' ? (
                          <div className="grid grid-cols-2 gap-4">
                              {q.options.map((option, oIdx) => {
                                  const isSelected = quizAnswers[qIdx] === oIdx;
                                  const isCorrect = q.correctAnswerIndex === oIdx;
                                  let buttonClass = "flex items-center justify-center p-4 rounded-xl border-2 transition-all font-bold ";
                                  
                                  if (quizSubmitted) {
                                      if (isCorrect) buttonClass += "bg-emerald-900/20 border-emerald-500 text-emerald-400";
                                      else if (isSelected && !isCorrect) buttonClass += "bg-red-900/20 border-red-500 text-red-400 opacity-50";
                                      else buttonClass += "border-zinc-800 opacity-40 text-zinc-500";
                                  } else {
                                      if (isSelected) buttonClass += "bg-indigo-900/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/20";
                                      else buttonClass += "border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700";
                                  }

                                  return (
                                      <button
                                          key={oIdx}
                                          disabled={quizSubmitted}
                                          onClick={() => {
                                              const newAnswers = [...quizAnswers];
                                              newAnswers[qIdx] = oIdx;
                                              setQuizAnswers(newAnswers);
                                          }}
                                          className={buttonClass}
                                      >
                                          {option}
                                      </button>
                                  )
                              })}
                          </div>
                      ) : (
                          <div className="space-y-3">
                            {q.options.map((option, oIdx) => {
                               const isSelected = quizAnswers[qIdx] === oIdx;
                               const isCorrect = q.correctAnswerIndex === oIdx;
                               let buttonClass = "w-full text-left p-3 rounded-md border transition-all relative ";
                               
                               if (quizSubmitted) {
                                   if (isCorrect) buttonClass += "bg-emerald-900/20 border-emerald-500 text-emerald-400 pl-10";
                                   else if (isSelected && !isCorrect) buttonClass += "bg-red-900/20 border-red-500 text-red-400";
                                   else buttonClass += "border-zinc-800 opacity-60 text-zinc-500";
                               } else {
                                   if (isSelected) buttonClass += "bg-indigo-900/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50";
                                   else buttonClass += "border-zinc-800 text-zinc-300 hover:bg-zinc-800";
                               }

                               return (
                                  <button
                                    key={oIdx}
                                    disabled={quizSubmitted}
                                    onClick={() => {
                                      const newAnswers = [...quizAnswers];
                                      newAnswers[qIdx] = oIdx;
                                      setQuizAnswers(newAnswers);
                                    }}
                                    className={buttonClass}
                                  >
                                    {quizSubmitted && isCorrect && (
                                        <BadgeCheck className="w-5 h-5 text-emerald-500 absolute left-3 top-3.5" />
                                    )}
                                    {option}
                                  </button>
                               )
                            })}
                          </div>
                      )}

                      {/* Explanation Feedback */}
                      {quizSubmitted && q.explanation && (
                          <div className={`mt-4 p-4 rounded-lg border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${isCorrectAnswer ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
                              {isCorrectAnswer ? (
                                  <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                              )}
                              <div>
                                  <p className={`text-sm font-bold mb-1 ${isCorrectAnswer ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {isCorrectAnswer ? 'Correct!' : 'Incorrect'}
                                  </p>
                                  <p className="text-sm text-zinc-300 leading-relaxed">{q.explanation}</p>
                              </div>
                          </div>
                      )}
                    </div>
                  )})}
                </div>

                <div className="mt-8 flex justify-center pb-12">
                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={quizAnswers.includes(-1)}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform active:scale-95 flex items-center"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Submit & Complete
                    </button>
                  ) : (
                    <div className="text-center w-full bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                        <p className="mb-1 text-sm text-zinc-500 uppercase tracking-wide font-bold">Your Score</p>
                        <p className="mb-6 text-4xl font-extrabold text-white">
                           {quizAnswers.filter((a, i) => a === activeModule.quiz.questions[i].correctAnswerIndex).length} 
                           <span className="text-xl text-zinc-600 font-normal"> / {activeModule.quiz.questions.length}</span>
                        </p>
                        <button
                            onClick={handleNext}
                            className="inline-flex items-center px-8 py-3 bg-white text-black rounded-lg font-semibold shadow-lg hover:bg-zinc-200 transition-transform transform active:scale-95"
                        >
                            Continue Next Module
                            <ChevronDown className="w-4 h-4 ml-2 -rotate-90" />
                        </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-950 flex justify-between items-center z-10">
           <button 
             onClick={() => {
                if (viewMode === 'exercises') setViewMode('lesson');
                else if (viewMode === 'quiz') setViewMode('exercises');
                else if (activeLessonIndex > 0) setActiveLessonIndex(prev => prev - 1);
                else if (activeModuleIndex > 0) {
                    setActiveModuleIndex(prev => prev - 1);
                    setActiveLessonIndex(course.modules[activeModuleIndex - 1].lessons.length - 1);
                    setViewMode('lesson');
                }
             }}
             disabled={(activeModuleIndex === 0 && activeLessonIndex === 0 && viewMode === 'lesson')}
             className="px-4 py-2 text-zinc-400 font-medium hover:text-white disabled:opacity-30 flex items-center border border-zinc-800 rounded-lg hover:bg-zinc-900 transition-colors"
           >
             <ChevronDown className="w-4 h-4 mr-2 rotate-90" />
             Previous
           </button>
           
           <div className="hidden sm:block text-xs font-medium text-zinc-500">
               {viewMode === 'lesson' ? `${activeLessonIndex + 1} / ${activeModule?.lessons.length} lessons` : viewMode === 'exercises' ? 'Practical' : 'Quiz'}
           </div>

           <button 
             onClick={handleNext}
             className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"
           >
             <span>Next</span>
             <ChevronDown className="w-4 h-4 -rotate-90" />
           </button>
        </div>
      </main>
    </div>
  );
};
