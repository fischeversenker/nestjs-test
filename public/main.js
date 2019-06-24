document.addEventListener('DOMContentLoaded', () => {
  const newStudentForm = window.newStudentForm;

  newStudentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formObject = Array.from(new FormData(newStudentForm)).reduce((acc, data) => {
      acc[data[0]] = data[1]; return acc;
    }, {});

    fetch(newStudentForm.action, {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify(formObject),
    }).then(updateStudents);
  });

  const updateStudents = () => {
    fetch('/students/html').then(res => res.text()).then(studentsHtml => {
      window.students.innerHTML = studentsHtml;
    });
  };
});
