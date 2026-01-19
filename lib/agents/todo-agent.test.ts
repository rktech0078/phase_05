import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTodoAgent } from './todo-agent';
import { TodoService } from '../services/todo.service';

// Mock TodoService
vi.mock('../services/todo.service', () => ({
    TodoService: {
        createTodo: vi.fn(),
        listTodos: vi.fn(),
        updateTodo: vi.fn(),
        completeTodo: vi.fn(),
        deleteTodo: vi.fn(),
        searchTodos: vi.fn(),
    },
}));

describe('Todo Agent "Smart" Logic', () => {
    const userId = 'user-123';
    const tools = createTodoAgent(userId).tools; // Access tools defined in the agent

    // Helper to find a tool by name - checks standard FunctionTool structure
    // console.log('tools', tools); // Debugging
    const findTool = (name: string) => tools.find((t: any) => t?.function?.name === name);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('update_todo tool', () => {
        const updateTool = findTool('update_todo');

        it('should find a task by fuzzy title and update it', async () => {
            // Mock search to return one task
            vi.mocked(TodoService.searchTodos).mockResolvedValue([
                { id: 'task-1', title: 'Buy Milk', description: '2% fat', userId, isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
            ]);
            // Mock update
            vi.mocked(TodoService.updateTodo).mockResolvedValue({
                id: 'task-1', title: 'Buy Almond Milk', description: 'Organic', userId, isCompleted: false, createdAt: new Date(), updatedAt: new Date()
            });

            const result = await updateTool.execute({
                current_title: 'milk',
                new_title: 'Buy Almond Milk',
                new_description: 'Organic'
            });

            expect(TodoService.searchTodos).toHaveBeenCalledWith(userId, 'milk');
            expect(TodoService.updateTodo).toHaveBeenCalledWith(userId, 'task-1', {
                title: 'Buy Almond Milk',
                description: 'Organic'
            });
            expect(result).toContain('Updated task: **Buy Almond Milk**');
        });

        it('should ask for clarification if multiple tasks match', async () => {
            vi.mocked(TodoService.searchTodos).mockResolvedValue([
                { id: '1', title: 'Buy Milk', userId } as any,
                { id: '2', title: 'Drink Milk', userId } as any
            ]);

            const result = await updateTool.execute({ current_title: 'milk', new_title: 'x' });
            expect(result).toContain('Found multiple tasks matching "milk"');
            expect(TodoService.updateTodo).not.toHaveBeenCalled();
        });

        it('should error if no tasks match', async () => {
            vi.mocked(TodoService.searchTodos).mockResolvedValue([]);
            const result = await updateTool.execute({ current_title: 'nomatch', new_title: 'x' });
            expect(result).toContain('Could not find any task matching "nomatch"');
        });
    });

    describe('delete_todo tool', () => {
        const deleteTool = findTool('delete_todo');

        it('should find a task by fuzzy title and delete it', async () => {
            vi.mocked(TodoService.searchTodos).mockResolvedValue([
                { id: 'del-1', title: 'Delete Me', userId } as any
            ]);
            vi.mocked(TodoService.deleteTodo).mockResolvedValue({ id: 'del-1', title: 'Delete Me' } as any);

            const result = await deleteTool.execute({ title: 'delete me' });

            expect(TodoService.searchTodos).toHaveBeenCalledWith(userId, 'delete me');
            expect(TodoService.deleteTodo).toHaveBeenCalledWith(userId, 'del-1');
            expect(result).toContain('Deleted: **Delete Me**');
        });
    });
});
