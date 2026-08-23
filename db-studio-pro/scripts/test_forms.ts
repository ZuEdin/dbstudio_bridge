const criteria = [
  "=[Forms]![Stammdaten]![Land]",
  "Like [Forms]![Stammdaten]![Land]",
  "> [Forms]![Stammdaten]![Land]"
];

for (const c of criteria) {
    const hasForm = /\[Forms\]!/i.test(c);
    console.log(`'${c}' has form: ${hasForm}`);
}
