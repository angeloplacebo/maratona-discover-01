const Modal = {
  update: -1,
  setModalTitle(text) {
    document.querySelector("#formTitle").innerHTML = text;
  },

  toggle() {
    Modal.update = -1;
    Form.clearFields();
    Modal.setModalTitle("Nova Transação");
    document.querySelector(".modal-overlay").classList.toggle("active");
  },

  updateTransaction(index) {
    Modal.toggle();
    Form.fillFields(Transaction.all[index]);
    Modal.setModalTitle("Editar Transação");
    Modal.update = index;
  },
};

const SortOptions = {
  toggle() {
    document.querySelector(".sort-options").classList.toggle("active");
  },
  infoToggle() {
    document.querySelector(".info.sort").classList.toggle("active");
  },
  onMouseOver(sort, order) {
    if (sort) {
      document.querySelector(".info.sort").firstElementChild.innerHTML =
        "Ordenar por " + sort + " em ordem " + order;
    } else {
      document.querySelector(".info.sort").firstElementChild.innerHTML =
        "Remover classificação";
    }
    this.infoToggle();
  },
};

const SweetAlert = {
  Toast: Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  }),

  confirmRemoval(index) {
    Modal.toggle();
    const { description } = Transaction.all[index];
    Swal.fire({
      title: `Tem certeza que deseja remover ${description} ?`,
      text: "Não será possivel desfazer esta ação!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#49aa26",
      cancelButtonColor: "#e92929",
      confirmButtonText: "Sim",
      cancelButtonText: "Não",
    }).then((result) => {
      if (result.isConfirmed) {
        Transaction.remove(index);
      }
    });
  },
};

const Storage = {
  get() {
    return JSON.parse(localStorage.getItem("dev.finances.transactions")) || [];
  },

  set(transactions) {
    localStorage.setItem(
      "dev.finances.transactions",
      JSON.stringify(transactions)
    );
  },
};

const Transaction = {
  all: Storage.get(),
  sorted: [],

  add(transaction) {
    Transaction.all.push(transaction);
    App.reload();
  },

  update(transaction, index) {
    Transaction.all[index] = transaction;
    SweetAlert.Toast.fire({
      icon: "success",
      title: "Sua transação foi atualizada!",
    });

    App.reload();
  },

  remove(index) {
    Transaction.all.splice(index, 1);

    SweetAlert.Toast.fire({
      icon: "success",
      title: "Sua transação foi deletada!",
    });

    App.reload();
  },

  incomes() {
    let income = 0;

    Transaction.all.forEach((transaction) => {
      if (transaction.amount > 0) {
        income += transaction.amount;
      }
    });
    return income;
  },

  expenses() {
    let expense = 0;

    Transaction.all.forEach((transaction) => {
      if (transaction.amount < 0) {
        expense += transaction.amount;
      }
    });
    return expense;
  },

  total() {
    return Transaction.incomes() + Transaction.expenses();
  },
};

const DOM = {
  transactionsContainer: document.querySelector("#data-table tbody"),

  addTransaction(transaction, index) {
    const tr = document.createElement("tr");
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;
    tr.onclick = () => {
      Modal.updateTransaction(index);
    };

    if (App.filter !== "none") {
      switch (App.filter) {
        case "only-expenses":
          if (transaction.amount > 0) {
            tr.style.display = "none";
          }
          break;
        case "only-incomes":
          if (transaction.amount < 0) {
            tr.style.display = "none";
          }
          break;
      }
    }

    DOM.transactionsContainer.appendChild(tr);
  },

  innerHTMLTransaction(transaction, index) {
    const transactionClass = transaction.amount < 0 ? "expense" : "income";
    const amount = Utils.formatCurrency(transaction.amount);

    const html = `
    <tr>
      <td class="description">${transaction.description}</td>
      <td class=${transactionClass}>${amount}</td>
      <td class="date">${transaction.date}</td>
      <td>
        <img onclick="SweetAlert.confirmRemoval(${index})" src="./assets/minus.svg" alt="Remover transação">
      </td>
    </tr>
    `;

    return html;
  },

  updateBalance() {
    document.getElementById("incomeDisplay").innerHTML = Utils.formatCurrency(
      Transaction.incomes()
    );

    document.getElementById("expenseDisplay").innerHTML = Utils.formatCurrency(
      Transaction.expenses()
    );

    document.getElementById("totalDisplay").innerHTML = Utils.formatCurrency(
      Transaction.total()
    );
  },

  clearTransactions() {
    DOM.transactionsContainer.innerHTML = "";
  },
};

const Utils = {
  formatAmount(value) {
    value = value * 100;
    return Math.round(value);
  },

  formatAmountToUpdate(value) {
    value = value / 100;
    return Math.round(value);
  },

  formatDate(date) {
    const splitedDate = date.split("-");
    return `${splitedDate[2]}/${splitedDate[1]}/${splitedDate[0]}`;
  },

  formatDateToUpdate(date) {
    const splitedDate = date.split("/");
    return `${splitedDate[2]}-${splitedDate[1]}-${splitedDate[0]}`;
  },

  formatCurrency(value) {
    const signal = Number(value) < 0 ? "- " : "";

    value = String(value).replace(/\D/g, "");

    value = Number(value) / 100;

    value = value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return signal + value;
  },

  sortByDate(order) {
    Transaction.sorted = Storage.get();
    Transaction.sorted.sort(function (a, b) {
      if (order == "desc") {
        var dateA = new Date(Utils.formatDateToUpdate(a.date));
        var dateB = new Date(Utils.formatDateToUpdate(b.date));
        return dateA - dateB;
      } else {
        var dateA = new Date(Utils.formatDateToUpdate(a.date));
        var dateB = new Date(Utils.formatDateToUpdate(b.date));
        return dateB - dateA;
      }
    });
    App.sort = "byDate_" + order;
    App.reload();
  },

  sortByAmount(order) {
    Transaction.sorted = Storage.get();
    Transaction.sorted.sort(function (a, b) {
      if (order == "desc") {
        return a.amount - b.amount;
      } else {
        return b.amount - a.amount;
      }
    });
    App.sort = "byAmount_" + order;
    App.reload();
  },

  sortByName(order) {
    Transaction.sorted = Storage.get();
    let t = Transaction.sorted.sort(function (a, b) {
      if (order == "desc") {
        return a.description > b.description
          ? -1
          : a.description < b.description
          ? 1
          : 0;
      } else {
        return a.description < b.description
          ? -1
          : a.description > b.description
          ? 1
          : 0;
      }
    });
    App.sort = "byName_" + order;
    App.reload();
  },

  removeSort() {
    App.sort = "default";
    App.reload();
  },
};

const Form = {
  description: document.querySelector("input#description"),
  amount: document.querySelector("input#amount"),
  date: document.querySelector("input#date"),

  getValues() {
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value,
    };
  },

  validateFields() {
    const { description, amount, date } = Form.getValues();

    if (
      description.trim() === "" ||
      amount.trim() === "" ||
      date.trim() === ""
    ) {
      throw new Error("Por favor, preencha todos os campos");
    }
  },

  formatValues() {
    let { description, amount, date } = Form.getValues();
    amount = Utils.formatAmount(amount);
    date = Utils.formatDate(date);

    return {
      description,
      amount,
      date,
    };
  },

  saveTransaction(transaction) {
    Transaction.add(transaction);
  },

  updateTransaction(transaction, index) {
    Transaction.update(transaction, index);
  },

  clearFields() {
    Form.description.value = "";
    Form.amount.value = "";
    Form.date.value = "";
  },

  fillFields(transaction) {
    Form.description.value = transaction.description;
    Form.amount.value = Utils.formatAmountToUpdate(transaction.amount);
    Form.date.value = Utils.formatDateToUpdate(transaction.date);
  },

  submit(event) {
    event.preventDefault();
    try {
      Form.validateFields();
      const transaction = Form.formatValues();
      if (Modal.update == -1) {
        Form.saveTransaction(transaction);
      } else {
        Form.updateTransaction(transaction, Modal.update);
      }
      Form.clearFields();
      Modal.toggle();
    } catch (error) {
      alert(error.message);
    }
  },
};

const App = {
  filter: "none",
  sort: "default",

  init() {
    if (this.sort != "default") {
      Transaction.sorted.forEach(DOM.addTransaction);
    } else {
      Transaction.all.forEach(DOM.addTransaction);
    }

    DOM.updateBalance();

    Storage.set(Transaction.all);
  },

  reload() {
    DOM.clearTransactions();
    App.init();
  },

  setFilter(filter) {
    this.filter = filter;
    App.reload();
  },
};

App.init();
