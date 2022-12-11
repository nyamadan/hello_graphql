import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, Input } from "@mui/material";
import React, { useCallback, useState } from "react";
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

  return (
    <div>
      <form onSubmit={onPost}>
        <Input
          value={inputText}
          onChange={onChangeInputText}
          inputProps={{ required: true }}
        />
        <Button type="submit">Add Todo</Button>

        {todoListData?.getTodoList.map((todo) => (
          <p key={todo.id}>{todo.text}</p>
        )) || null}
      </form>
    </div>
  );
}

export default App;
