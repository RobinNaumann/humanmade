import { Banner, Button, Column, Dialog, Field, Icons } from "elbe-ui";
import { useState } from "react";
import { serverAuth } from "../app";
import { useAuth } from "../bit/b_auth";

export function LoginButton(p: {}) {
  const authState = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [username, setUsername] = useState<string | null>("");
  const [password, setPassword] = useState<string | null>("");
  const [err, setErr] = useState<string | null>(null);

  function login() {
    if (!username) {
      setUsername(null);
      return;
    }
    if (!password) {
      setPassword(null);
      return;
    }
    serverAuth
      .login({ username: username || "", password: password || "" })
      .then(() => {
        setDialogOpen(false);
        setUsername("");
        setPassword("");
        setErr(null);
      })
      .catch((e) => {
        setUsername("");
        setPassword("");
        setErr(e.message || e.toString());
      });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      login();
    }
  }

  return authState.user ? (
    <Button.major
      icon={Icons.LogOut}
      ariaLabel={`logout ${authState.user.id}`}
      onTap={() => authState.signOut()}
    />
  ) : (
    <>
      <Button.major
        icon={Icons.LogIn}
        ariaLabel={`login to the site`}
        onTap={() => setDialogOpen(true)}
      />
      <Dialog
        dismissible="button"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Login"
      >
        <Column gap={2}>
          <Column>
            <Field.text
              ariaLabel="username"
              value={username ?? ""}
              onInput={setUsername}
              label="Username"
              errorMessage={
                username === null ? "Username is required" : undefined
              }
              flex
              native={{ onKeyDown: handleKeyDown }}
            />
            <Field.password
              ariaLabel="password"
              value={password ?? ""}
              onInput={setPassword}
              label="Password"
              errorMessage={
                password === null ? "Password is required" : undefined
              }
              flex
              native={{ onKeyDown: handleKeyDown }}
            />
            {err && (
              <Banner
                kind="error"
                title="login failed"
                onDismiss={() => setErr(null)}
              />
            )}
          </Column>
          <Button.major
            ariaLabel="login to the site"
            label="helloo"
            icon={Icons.LogIn}
            onTap={login}
          />
        </Column>
      </Dialog>
    </>
  );
}
