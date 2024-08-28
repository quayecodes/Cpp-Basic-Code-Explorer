#include <iostream>

using namespace std;

int main()
{
    cout << "\t Code by: Michael N.A. Quaye         Email:millcode@outlook.com" <<endl;
    cout <<endl;
    cout << "---Program to ask password from a user until correct password is given---" <<endl;
    const string code ="hidden";
    string input;
    do
    {
        cout << "Enter Your password: ";
        cin >> input;
        if (input != code)
        {
            cout << "Wrong Password, Enter Password Again" <<endl;

        }

    }while (input != code);

    cout << endl;
    cout << "Great! Password is Accepted" <<endl;

    return 0;
}
