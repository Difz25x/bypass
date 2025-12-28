(() => {
  const data = {
    accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3B1Ymxpc2hlci5saW5rdmVydGlzZS5jb20vYXBpL3YxL2F1dGgvbG9naW4iLCJpYXQiOjE3NjYzMzIwNzIsIm5iZiI6MTc2NjMzMjA3MiwianRpIjoiOE5pT1lwZ1Z4dlFVem9UViIsInN1YiI6NTc1MDM1MSwicHJ2IjoiN2IzZmVmNDNmOTgxZTE3Nzc5MGQwMGJkZjQ1M2ZhZGM3NzNmNzI4YyJ9.-9txJYUYwOmqqCPs-y3XePwBWqV9qWQzkU8-NPH0J_A",
    user_token: "X0Ph7bOT4KCByi11PpnZRaNm5rVVha4sOqB7tpDIoUsWXGlm8xziOLZqkxCqjkZQ",
    subId: "3773872816150989170",
    user_current_location: "pa"
  };

  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, value);
  }

  location.reload();
})();
