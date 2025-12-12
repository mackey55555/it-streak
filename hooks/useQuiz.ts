import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Question = Database['public']['Tables']['questions']['Row'];

interface QuizResult {
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
}

export const useQuiz = (questionCount: number = 5) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;
  const totalQuestions = questions.length;

  // 問題を取得
  const fetchQuestions = async (categoryId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('questions')
        .select('*')
        .limit(questionCount * 2); // 多めに取得してランダム選択

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        throw new Error('問題が見つかりませんでした');
      }

      // ランダムに選択
      const shuffled = data.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

      setQuestions(selected);
      setCurrentIndex(0);
      setResults([]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // 回答を送信
  const submitAnswer = async (selectedAnswer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    // 回答結果を保存
    const result: QuizResult = {
      questionId: currentQuestion.id,
      selectedAnswer,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect,
    };

    setResults([...results, result]);

    // Supabaseに保存
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('user_answers').insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
        });
      }
    } catch (err) {
      console.error('Error saving answer:', err);
    }

    return result;
  };

  // 次の問題へ
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(questions.length); // finished状態へ
    }
  };

  // リセット
  const reset = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setResults([]);
    setError(null);
  };

  // 統計情報
  const correctCount = results.filter(r => r.isCorrect).length;
  const incorrectCount = results.filter(r => !r.isCorrect).length;
  const accuracy = results.length > 0 ? (correctCount / results.length) * 100 : 0;

  return {
    questions,
    currentQuestion,
    currentIndex,
    totalQuestions,
    isFinished,
    results,
    correctCount,
    incorrectCount,
    accuracy,
    loading,
    error,
    fetchQuestions,
    submitAnswer,
    nextQuestion,
    reset,
  };
};

