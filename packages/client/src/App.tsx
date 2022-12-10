import { ApolloClient, gql, useApolloClient } from "@apollo/client";
import { Button, Input } from "@mui/material";
import React, { useCallback, useState } from "react";
import { Post, User } from "server/src/types/generated/graphql";

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

const getUser = async (
  client: ApolloClient<object>,
  userId: string,
  useCache?: boolean
) => {
  const response = await client.query<{ getUser: User }>({
    query: gql`
      query Query($userId: String!) {
        getUser(id: $userId) {
          id
          name
          posts {
            id
            text
          }
        }
      }
    `,
    variables: { userId },
    fetchPolicy: useCache ? "cache-first" : "no-cache",
  });

  return response.data?.getUser || null;
};

const addUser = async (client: ApolloClient<object>, name: string) => {
  const response = await client.mutate<{ addUser: User }>({
    mutation: gql`
      mutation Mutation($name: String!) {
        addUser(name: $name) {
          id
          name
        }
      }
    `,
    variables: { name },
  });

  return response.data?.addUser || null;
};

const addPost = async (
  client: ApolloClient<object>,
  userId: string,
  text: string
) => {
  const response = await client.mutate<{ addPost: Post }>({
    mutation: gql`
      mutation Mutation($userId: String!, $text: String!) {
        addPost(userId: $userId, text: $text) {
          id
          text
        }
      }
    `,
    variables: { userId, text },
  });
  return response.data?.addPost || null;
};

function App() {
  const client = useApolloClient();
  const [user, setUser] = useState<User | null>(null);
  const [inputName, setInputName, onChangeInputName] = useInputText();
  const [inputText, setInputText, onChangeInputText] = useInputText();

  const onRegisterUser = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const user = await addUser(client, inputName);
      setInputName("");
      setUser(user);
    },
    [client, inputName, setInputName]
  );

  const onPost = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (user == null) {
        return;
      }

      await addPost(client, user.id, inputText);
      setInputText("");

      const newUser = await getUser(client, user.id);
      setUser(newUser);
    },
    [client, inputText, setInputText, user]
  );

  return (
    <div>
      {user == null ? (
        <form onSubmit={onRegisterUser}>
          <Input
            value={inputName}
            onChange={onChangeInputName}
            inputProps={{ maxLength: 10, required: true }}
          />
          <Button type="submit">Add User</Button>
        </form>
      ) : (
        <>
          <p>{user.name}</p>
          <form onSubmit={onPost}>
            <Input
              value={inputText}
              onChange={onChangeInputText}
              inputProps={{ required: true }}
            />
            <Button type="submit">Add Post</Button>
          </form>
          {user.posts?.flatMap((post) =>
            post != null ? [<p key={post.id}>{post.text}</p>] : []
          )}
        </>
      )}
    </div>
  );
}

export default App;
