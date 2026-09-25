import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Filter,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Share2,
} from 'lucide-react';
import { useLibraryBooks, useAddBook, useIssueBook } from '../../hooks/useLibrarianData';

export const InventoryManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<any>(null);

  // Form states for adding book
  const [newBook, setNewBook] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publicationYear: new Date().getFullYear(),
    category: 'GENERAL',
    shelfLocation: '',
    totalCopies: 1,
    coverImageUrl: '',
  });

  // Form states for issuing book
  const [issueData, setIssueData] = useState({
    studentId: '',
    dueDate: '',
    notes: '',
  });

  const { data: books = [], isLoading, error } = useLibraryBooks({
    search: searchTerm,
    category: selectedCategory,
    availableOnly,
  });

  const addBookMutation = useAddBook();
  const issueBookMutation = useIssueBook();

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBookMutation.mutateAsync({
        ...newBook,
        totalCopies: Number(newBook.totalCopies),
        publicationYear: Number(newBook.publicationYear),
      });
      setIsAddModalOpen(false);
      setNewBook({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        publicationYear: new Date().getFullYear(),
        category: 'GENERAL',
        shelfLocation: '',
        totalCopies: 1,
        coverImageUrl: '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to catalog book');
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForIssue) return;

    try {
      await issueBookMutation.mutateAsync({
        bookId: selectedBookForIssue.id,
        studentId: issueData.studentId.trim(),
        dueDate: issueData.dueDate || undefined,
        notes: issueData.notes || undefined,
      });
      setIsIssueModalOpen(false);
      setSelectedBookForIssue(null);
      setIssueData({ studentId: '', dueDate: '', notes: '' });
      alert(`Book '${selectedBookForIssue.title}' successfully issued!`);
    } catch (err: any) {
      alert(err.message || 'Failed to issue book');
    }
  };

  const categories = ['ALL', 'COMPUTING', 'EDUCATION', 'SCIENCES', 'LANGUAGES', 'ARTS', 'VOCATIONAL', 'GENERAL'];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN, shelf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-none font-medium cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Disciplines' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Available Only Toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded text-emerald-800 focus:ring-emerald-700"
            />
            <span className="font-semibold">Available Only</span>
          </label>
        </div>

        {/* Add New Book Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Catalog New Book</span>
        </button>
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-emerald-700 animate-pulse" />
          Querying college library catalog...
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center text-xs text-rose-700">
          Failed to load library catalog.
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold text-slate-700">No books found matching criteria</p>
          <p className="text-slate-400">Try adjusting your search terms or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map((book) => {
            const hasAvailable = book.availableCopies > 0;
            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Category & Availability Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {book.category}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        hasAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {hasAvailable ? `${book.availableCopies} Available` : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {book.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">By {book.author}</p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold truncate">{book.shelfLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{book.totalCopies} Total Copies</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    ISBN: {book.isbn} {book.publicationYear ? `(${book.publicationYear})` : ''}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {book.borrowedCopies} on loan
                  </span>
                  <button
                    disabled={!hasAvailable}
                    onClick={() => {
                      setSelectedBookForIssue(book);
                      setIsIssueModalOpen(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      hasAvailable
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Issue Book</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Catalog New Book Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Catalog New Academic Book</h3>
                  <p className="text-xs text-slate-500">Add physical textbook volume to college repository</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fundamentals of Data Structures & Algorithms"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Author(s) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. O. C. Nwankwo"
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">ISBN Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 978-978-49012-7-4"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Academic Category *</label>
                  <select
                    value={newBook.category}
                    onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  >
                    <option value="GENERAL">General Reference</option>
                    <option value="COMPUTING">Computer Science & ICT</option>
                    <option value="EDUCATION">Education & Pedagogy</option>
                    <option value="SCIENCES">Sciences & Mathematics</option>
                    <option value="LANGUAGES">Languages & Literature</option>
                    <option value="ARTS">Arts & Social Sciences</option>
                    <option value="VOCATIONAL">Vocational & Technical</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Shelf Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STACK-CSC-03"
                    value={newBook.shelfLocation}
                    onChange={(e) => setNewBook({ ...newBook, shelfLocation: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Total Copies Received *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBook.totalCopies}
                    onChange={(e) => setNewBook({ ...newBook, totalCopies: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Publisher</label>
                  <input
                    type="text"
                    placeholder="e.g. Evans Brothers Ltd"
                    value={newBook.publisher}
                    onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Year of Publication</label>
                  <input
                    type="number"
                    value={newBook.publicationYear}
                    onChange={(e) => setNewBook({ ...newBook, publicationYear: parseInt(e.target.value, 10) || 2026 })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBookMutation.isPending}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {addBookMutation.isPending ? 'Cataloging...' : 'Catalog Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {isIssueModalOpen && selectedBookForIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Issue Book to Student</h3>
                  <p className="text-xs text-slate-500">Record loan and configure due date</p>
                </div>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Volume</span>
              <p className="font-bold text-slate-900">{selectedBookForIssue.title}</p>
              <p className="text-slate-500">
                Author: {selectedBookForIssue.author} | Shelf: {selectedBookForIssue.shelfLocation}
              </p>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Student Matric Number or Student ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COEKA/2026/NCE/084 or std-001"
                  value={issueData.studentId}
                  onChange={(e) => setIssueData({ ...issueData, studentId: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Loan Due Date (Default: 14 Days)
                </label>
                <input
                  type="date"
                  value={issueData.dueDate}
                  onChange={(e) => setIssueData({ ...issueData, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Notes / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Research reference for final year project chapter 2"
                  value={issueData.notes}
                  onChange={(e) => setIssueData({ ...issueData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueBookMutation.isPending}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {issueBookMutation.isPending ? 'Issuing...' : 'Confirm Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
