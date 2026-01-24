import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Question = Database['public']['Tables']['questions']['Row'];

interface IncorrectQuestion {
  question_id: string;
  last_answered_at: string;
}

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

      // ユーザーの選択した試験を取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_exam_id')
        .eq('id', user.id)
        .single();

      const examId = profile?.selected_exam_id;
      if (!examId) {
        throw new Error('試験が選択されていません。設定画面で試験を選択してください。');
      }

      // 選択された試験のカテゴリIDを取得
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('exam_id', examId);

      if (categoriesError) throw categoriesError;

      if (!categories || categories.length === 0) {
        throw new Error('選択された試験にカテゴリがありません');
      }

      const categoryIds = categories.map(c => c.id);

      // まず問題数を取得
      let countQuery = supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .in('category_id', categoryIds);

      if (categoryId) {
        countQuery = countQuery.eq('category_id', categoryId);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // 全問題を取得（または十分な数）
      const limit = count ? Math.min(count, 1000) : 1000; // 最大1000問まで取得

      let query = supabase
        .from('questions')
        .select('*')
        .in('category_id', categoryIds)
        .limit(limit);

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

  // 間違えた問題を取得
  const fetchIncorrectQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      // 各問題について最新の回答のみを取得（間違えたもの）
      const { data: incorrectAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select('question_id, answered_at')
        .eq('user_id', user.id)
        .eq('is_correct', false)
        .order('answered_at', { ascending: false });

      if (answersError) throw answersError;

      if (!incorrectAnswers || incorrectAnswers.length === 0) {
        throw new Error('復習する問題がありません');
      }

      // 問題IDのリストを作成（重複を排除）
      const questionIds = Array.from(new Set(incorrectAnswers.map(a => a.question_id)));

      // 該当する問題を取得（間違えた問題のIDリストから取得するため、limitは不要）
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        throw new Error('問題が見つかりませんでした');
      }

      // ランダムに選択
      const shuffled = questionsData.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

      setQuestions(selected);
      setCurrentIndex(0);
      setResults([]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching incorrect questions:', err);
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
    fetchIncorrectQuestions,
    submitAnswer,
    nextQuestion,
    reset,
  };
};

