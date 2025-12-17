
import React, { useState, useMemo } from 'react';
import { FiEye, FiSearch } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
);

const DebtPage: React.FC = () => {
  const { customers, setPayingCustomerId } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const customersWithDebt = useMemo(() => {
    return customers
      .filter(c => c.debt > 0)
      .sort((a, b) => b.debt - a.debt);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) {
      return customersWithDebt;
    }
    return customersWithDebt.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  }, [customersWithDebt, searchTerm]);

  const totalDebt = useMemo(() => {
    return customersWithDebt.reduce((sum, c) => sum + c.debt, 0);
  }, [customersWithDebt]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hidden lg:block">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Công nợ</h1>
        <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Theo dõi và quản lý các khoản phải thu từ khách hàng.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Tổng Dư Nợ" value={`${totalDebt.toLocaleString('vi-VN')} đ`} color="text-red-600" />
        <StatCard title="Số Khách Hàng Nợ" value={customersWithDebt.length.toString()} color="text-slate-800 dark:text-slate-200" />
      </div>

      {/* Filters & Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm khách hàng theo tên hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 lg:w-1/3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
        {/* Table View */}
        <div className="overflow-x-auto hidden lg:block">
            <table className="min-w-full">
              <thead className="bg-primary-50 dark:bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Tên khách hàng</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Công nợ</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số điện thoại</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{customer.debt.toLocaleString('vi-VN')} đ</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => setPayingCustomerId(customer.id)} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-2 transition-transform hover:scale-105" title="Xem chi tiết nợ">
                        <FiEye />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                  ))
                ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400">
                        {searchTerm ? 'Không tìm thấy khách hàng nào khớp với tìm kiếm.' : 'Chúc mừng! Không có khách hàng nào đang nợ.'}
                      </td>
                    </tr>
                )}
              </tbody>
            </table>
        </div>
        {/* Card View */}
        <div className="lg:hidden">
            {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                <div key={customer.id} className="p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{customer.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{customer.phone}</p>
                        </div>
                         <button onClick={() => setPayingCustomerId(customer.id)} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 text-sm" title="Xem chi tiết nợ">
                            <FiEye />
                            <span>Chi tiết</span>
                        </button>
                    </div>
                    <div className="mt-1">
                        <p className="text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Công nợ: </span>
                             <span className="font-bold text-red-600">{customer.debt.toLocaleString('vi-VN')} đ</span>
                        </p>
                    </div>
                </div>
            )) : (
                 <div className="text-center py-10 text-slate-500 dark:text-slate-400 px-4">
                    {searchTerm ? 'Không tìm thấy khách hàng nào khớp với tìm kiếm.' : 'Chúc mừng! Không có khách hàng nào đang nợ.'}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DebtPage;
