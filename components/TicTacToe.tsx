
import React, { useState } from 'react';

const Square: React.FC<{ value: 'X' | 'O' | null, onClick: () => void }> = ({ value, onClick }) => (
  <button 
    className="w-16 h-16 sm:w-20 sm:h-20 bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 text-3xl font-bold flex items-center justify-center text-light-text dark:text-dark-text rounded-md transition-colors"
    onClick={onClick}
    aria-label={`Square ${value || 'empty'}`}
  >
    {value}
  </button>
);

const calculateWinner = (squares: Array<'X' | 'O' | null>): 'X' | 'O' | null => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

export const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState<Array<'X' | 'O' | null>>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const handleClick = (i: number) => {
    if (winner || board[i]) {
      return;
    }
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };
  
  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  }

  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (isDraw) {
    status = 'It\'s a Draw!';
  } else {
    status = `Next player: ${xIsNext ? 'X' : 'O'}`;
  }

  return (
    <div className="flex flex-col items-center p-4 bg-light-surface dark:bg-dark-surface rounded-lg shadow-inner">
      <div className="text-lg font-semibold mb-4">{status}</div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {board.map((_, i) => (
          <Square key={i} value={board[i]} onClick={() => handleClick(i)} />
        ))}
      </div>
      {(winner || isDraw) && (
        <button
          onClick={handleReset}
          className="bg-light-accent dark:bg-dark-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
        >
          Play Again
        </button>
      )}
    </div>
  );
};
