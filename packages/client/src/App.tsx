import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, Checkbox, FormLabel, Input } from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";
import type { Todo } from "server/src/types/generated/graphql";

const useInputText = (): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
] => {
  const [inputText, setInputText] = useState<string>("");
  const onChangeInputText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInputText(e.target.value);
    },
    []
  );

  return [inputText, setInputText, onChangeInputText];
};

const TodoList = ({
  onClickTodoCheckbox,
  todoList,
  prefix,
}: {
  prefix: string;
  onClickTodoCheckbox: (e: React.MouseEvent<HTMLButtonElement>) => void;
  todoList?: readonly Todo[];
}) => {
  return (
    <>
      {(todoList ?? []).map((todo) => (
        <div key={`${prefix}-${todo.id}`}>
          <FormLabel>
            <Checkbox
              onClick={onClickTodoCheckbox}
              inputProps={
                {
                  "data-todo-id": todo.id,
                } as unknown as React.InputHTMLAttributes<HTMLInputElement>
              }
              checked={todo.status === "CLOSE"}
            />
            {todo.text}
          </FormLabel>
        </div>
      ))}
    </>
  );
};

function App() {
  const { data: todoListData, refetch: refetchTodoList } = useQuery<{
    getTodoList: ReadonlyArray<Todo>;
  }>(gql`
    query GetTodoList {
      getTodoList {
        createdAt
        id
        status
        text
      }
    }
  `);

  const todoList = useMemo(
    () => todoListData?.getTodoList ?? [],
    [todoListData?.getTodoList]
  );

  const openTodoList = useMemo(
    () => todoList.filter((todo) => todo.status !== "CLOSE"),
    [todoList]
  );

  const closeTodoList = useMemo(
    () => todoList.filter((todo) => todo.status === "CLOSE"),
    [todoList]
  );

  const [addTodo] = useMutation<{ addTodo: Todo }, { text: string }>(gql`
    mutation Mutation($text: String!) {
      addTodo(text: $text) {
        id
        text
        status
        createdAt
      }
    }
  `);

  const [updateTodo] = useMutation<
    { updateTodo: Todo },
    { id: string; status?: Todo["status"]; text?: string }
  >(gql`
    mutation Mutation($id: String!, $status: TodoStatus, $text: String) {
      updateTodo(id: $id, status: $status, text: $text) {
        id
        text
        status
        createdAt
      }
    }
  `);
  const [inputText, setInputText, onChangeInputText] = useInputText();

  const onPost = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const text = inputText;
      setInputText("");
      await addTodo({
        variables: {
          text,
        },
      });
      await refetchTodoList();
    },
    [addTodo, inputText, refetchTodoList, setInputText]
  );

  const onClickTodoCheckbox = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      (async () => {
        const { todoId } = (
          e.target as unknown as { dataset: { todoId: string } }
        ).dataset;

        const idx = todoList.findIndex((todo) => todo.id == todoId);
        if (idx === -1) {
          return;
        }

        const todo = todoList[idx];
        const status: Todo["status"] =
          todo.status === "OPEN" ? "CLOSE" : "OPEN";

        await updateTodo({
          variables: {
            id: todoId,
            status,
          },
        });

        await refetchTodoList();
      })();
    },
    [refetchTodoList, todoList, updateTodo]
  );

  return (
    <div>
      <form onSubmit={onPost}>
        <Input
          value={inputText}
          onChange={onChangeInputText}
          inputProps={{ required: true }}
        />
        <Button type="submit">Add Todo</Button>

        <TodoList
          prefix="open"
          onClickTodoCheckbox={onClickTodoCheckbox}
          todoList={openTodoList}
        />
        <details>
          <summary>Completed</summary>
          <TodoList
            prefix="close"
            onClickTodoCheckbox={onClickTodoCheckbox}
            todoList={closeTodoList}
          />
        </details>
      </form>
    </div>
  );
}

export default App;
