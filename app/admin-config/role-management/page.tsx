// app/admin-config/role-management/page.tsx
"use client";

import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useCallback } from "react"; // Import useCallback
import { toast } from "react-hot-toast";
import { FaTimes } from "react-icons/fa";
import BackButton from '@/components/BackButton';

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  division: string;
  email: string;
}

const roleColors: { [role: string]: string } = {
  master: "bg-[#9CA3AF]",
  maker: "bg-[#FFB74D]",
  approver: "bg-[#7986CB]",
  dev_vdh: "bg-[#E57373]",
  ops_vdh: "bg-[#E57373]",
};

const roles = ["maker", "approver", "master", "dev_vdh", "ops_vdh"];
const divisions = [
    "Information Technology",
    "Information Technology Security",
    "Digital Banking",
    "Corporate Secretary",
    "Hukum",
    "Change Management Office",
    "Jaringan dan Layanan",
    "Operasi",
    "Umum",
    "Komersial",
    "Korporasi",
    "KPR dan KKB",
    "Kredit Konsumer",
    "Kredit Ritel",
    "Kredit UMKM",
    "Manajemen Risiko",
    "Treasury",
];

export default function RoleManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    // Use useCallback to memoize the fetchUsers function
    const fetchUsers = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/users`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setUsers(result.data);
            } else {
                setError(result.message || "Failed to fetch users.");
            }
        } catch (err) {
            setError((err as Error).message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, token]); // Add fetchUsers to the dependency array

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
    };

    const handleUpdateUser = async (updatedUser: User) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/users/${updatedUser.id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: updatedUser.name,
            role: updatedUser.role,
            division: updatedUser.division,
            email: updatedUser.email,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `HTTP error! Status: ${response.status}`);
        }

        if (result.success) {
          toast.success("User updated successfully!");
          setSelectedUser(null); // Close the modal after update
          await fetchUsers(); // Refresh the user list
        } else {
          toast.error(result.error || "Failed to update user.");
        }
      } catch (err) {
        const errorMessage = (err as Error).message || "An unexpected error occurred";
        toast.error(errorMessage);
      }
    };

    const handleOpenAddUserModal = () => {
        setIsAddUserModalOpen(true);
    };

    const handleCloseAddUserModal = () => {
        setIsAddUserModalOpen(false);
    };

    const handleAddUser = async (newUser: Omit<User, "id"> & { password: string }) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/users`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newUser),
            });
    
            const result = await response.json();
    
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! Status: ${response.status}`);
            }
    
            if (result.success) {
                toast.success(result.message || "User added successfully!");
                setIsAddUserModalOpen(false); // Close modal first
                await fetchUsers(); // Refresh users
            } else {
                setError(result.message || "Failed to add user.");
                toast.error(result.message || "Failed to add user.");
            }
        } catch (err) {
            const errorMessage = (err as Error).message || "An unexpected error occurred";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };
    

    return (
        <ProtectedRoute allowedRoles={['approver', 'master']}>
            <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex">
                <Sidebar />
                <div className="flex-1 md:ml-60 p-6">
                    <BackButton />
                    <h1 className="text-3xl font-bold mb-4 text-center text-gray-900 dark:text-white">Role Management</h1>
                    <div className="bg-gray-800 rounded-lg p-4 mb-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
                        <div className="flex items-stretch space-x-4">
                            <button
                                className="px-4 py-2 bg-green-500 hover:bg-green-700 rounded flex items-center space-x-2 text-white h-full"
                                onClick={handleOpenAddUserModal}
                            >
                                <span>Add User</span>
                            </button>
                        </div>
                    </div>

                    {loading && <div className="text-center text-gray-500 dark:text-gray-300">Loading users...</div>}
                    {error && <div className="text-center text-red-500">{error}</div>}

                    {!loading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-900 dark:text-white">
                            {users.map((user) => (
                                <UserCard key={user.id} user={user} onSelect={handleSelectUser} />
                            ))}
                        </div>
                    )}

                    {selectedUser && (
                        <UserModal user={selectedUser} onClose={handleCloseModal} onUpdate={handleUpdateUser} />
                    )}

                    {isAddUserModalOpen && (
                        <AddUserModal onClose={handleCloseAddUserModal} onAdd={handleAddUser} />
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

function UserCard({ user, onSelect }: { user: User; onSelect: (user: User) => void }) {
  const roleColorClass = (roleColors[user.role] || "bg-gray-700");
  return (
    <div // Added theme-aware background and hover
      className="bg-white dark:bg-gray-800 rounded-lg flex overflow-hidden shadow-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200"
      onClick={() => onSelect(user)}
    >
      <div className={`${roleColorClass} w-2`}></div>
      <div className="p-4 text-gray-900 dark:text-white"> {/* Added theme-aware text */}
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{user.name}</h2>
        <p className="text-gray-700 dark:text-gray-300">Username: {user.username}</p>
        <p className="text-gray-700 dark:text-gray-300">Role: {user.role}</p>
        <p className="text-gray-700 dark:text-gray-300">Division: {user.division}</p>
        <p className="text-gray-700 dark:text-gray-300">Email: {user.email}</p>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onUpdate }: { user: User; onClose: () => void; onUpdate: (user: User) => void }) {
    const [editedUser, setEditedUser] = useState({ ...user }); // Initialize with a copy of the user data

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setEditedUser((prev) => ({ ...prev, [id]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl w-full max-w-2xl text-gray-900 dark:text-white">
                {/* Header Section */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Edit User</h2>
                    <button onClick={onClose} title="Close" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 focus:outline-none">
                        <FaTimes className="h-6 w-6" />
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-6">
                    {/* User Information Form */}
                    <div className="flex flex-col mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name:</label>
                        <input
                            type="text"
                            id="name"
                            placeholder="Name"
                            value={editedUser.name}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    <div className="flex flex-col mb-4">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role:</label>
                        <select
                            id="role"
                            value={editedUser.role}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                            required
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col mb-4">
                        <label htmlFor="division" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Division:</label>
                        <select
                            id="division"
                            value={editedUser.division}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                            required
                        >
                            {divisions.map((division) => (
                                <option key={division} value={division}>{division}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email:</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Email"
                            value={editedUser.email}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                            required
                        />
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-500 dark:hover:bg-gray-700 dark:text-white rounded transition duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onUpdate(editedUser)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-200"
                    >
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (newUser: Omit<User, "id"> & { password: string }) => void }) {
    const [newUser, setNewUser] = useState({
        name: "",
        username: "",
        password: "",
        role: "",
        division: "",
        email: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setNewUser((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onAdd(newUser); // Call the parent component's onAdd function
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl w-full max-w-2xl text-gray-900 dark:text-white">
          {/* Header Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add User</h2>
            <button onClick={onClose} title="Close" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 focus:outline-none">
              <FaTimes className="h-6 w-6" />
            </button>
          </div>

          {/* Content Section */}
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              {/* User Information Form */}
              <div className="flex flex-col mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name:</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Name"
                  value={newUser.name}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex flex-col mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username:</label>
                <input
                  type="text"
                  id="username"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex flex-col mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password:</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex flex-col mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role:</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col mb-4">
                <label htmlFor="division" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Division:</label>
                <select
                  id="division"
                  value={newUser.division}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:focus:border-blue-500 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Division</option>
                  {divisions.map((division) => (
                    <option key={division} value={division}>{division}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email:</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Footer Section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-500 dark:hover:bg-gray-700 dark:text-white rounded transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-200"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    );
}