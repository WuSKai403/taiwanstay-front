import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { UserRole } from '@/models/enums/UserRole';
import {
  UserIcon,
  Squares2X2Icon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/layout/AdminLayout';

// 用戶類型定義
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  status: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;

  // 獲取用戶數據
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);

        // 這裡應當是真實 API 調用
        // const response = await fetch(`/api/admin/users?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&role=${roleFilter}`);
        // const data = await response.json();

        // 模擬數據
        const mockUsers: User[] = Array.from({ length: 25 }, (_, i) => ({
          id: `user_${i + 1}`,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          role: i % 5 === 0 ? UserRole.ADMIN :
                i % 4 === 0 ? UserRole.HOST : UserRole.USER,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
          status: i % 7 === 0 ? 'suspended' : 'active'
        }));

        // 過濾模擬數據
        let filteredUsers = mockUsers;
        if (searchTerm) {
          filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        if (roleFilter !== 'ALL') {
          filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }

        const totalFilteredUsers = filteredUsers.length;
        const calculatedTotalPages = Math.ceil(totalFilteredUsers / itemsPerPage);

        // 分頁
        const paginatedUsers = filteredUsers.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        );

        setUsers(paginatedUsers);
        setTotalPages(calculatedTotalPages);
        setTotalUsers(totalFilteredUsers);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  // 處理搜索
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1); // 搜索時重置頁碼
  };

  // 處理角色過濾
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // 過濾時重置頁碼
  };

  // 處理分頁
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>用戶管理 | Taiwan Stay Admin</title>
      </Head>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">用戶管理</h1>
            <p className="mt-2 text-sm text-gray-700">
              管理系統中的所有用戶，包括一般用戶、房東和管理員。
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/admin/users/create"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              新增用戶
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="搜尋用戶名稱或郵箱"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    搜尋
                  </button>
                </form>

                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  <select
                    value={roleFilter}
                    onChange={handleRoleFilterChange}
                    className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="ALL">所有角色</option>
                    <option value={UserRole.USER}>用戶</option>
                    <option value={UserRole.HOST}>房東</option>
                    <option value={UserRole.ADMIN}>管理員</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          用戶名稱
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          郵箱
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          角色
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          狀態
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          註冊日期
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">操作</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                            沒有找到符合條件的用戶
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              <div className="flex items-center">
                                <UserCircleIcon className="mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                                {user.name}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                user.role === UserRole.ADMIN
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === UserRole.HOST
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role === UserRole.ADMIN ? '管理員'
                                  : user.role === UserRole.HOST ? '房東'
                                  : '用戶'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                user.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status === 'active' ? '活躍' : '停用'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/admin/users/${user.id}`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <span className="sr-only">查看 {user.name}</span>
                                  <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                                </Link>
                                <button
                                  type="button"
                                  className="text-red-600 hover:text-red-900"
                                  onClick={() => {
                                    // 刪除用戶邏輯 - 應該顯示一個確認對話框
                                    if (window.confirm(`確定要刪除用戶 ${user.name}?`)) {
                                      console.log('刪除用戶:', user.id);
                                      // 刪除邏輯
                                    }
                                  }}
                                >
                                  <span className="sr-only">刪除 {user.name}</span>
                                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 分頁 */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  顯示 <span className="font-medium">{users.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> 到 <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalUsers)}</span> 條，共 <span className="font-medium">{totalUsers}</span> 條結果
                </div>
                <div className="flex justify-end">
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="sr-only">上一頁</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {[...Array(totalPages).keys()].map((page) => (
                      <button
                        key={page + 1}
                        onClick={() => handlePageChange(page + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === page + 1
                            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {page + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="sr-only">下一頁</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}