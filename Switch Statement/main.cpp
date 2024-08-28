#include <iostream>

using namespace std;

int main()
{
    cout << "-------------------------Switch Statement--------------------" << endl;
    cout << "Code By: Michael N.A. Quaye          Email: millcode@outlook.com" <<endl;
    cout <<endl;

    int input;
    cout << "Enter Secret code >>";
    cin >>input;

    switch(input)
    {
        case 112:
        {
            cout << "1. Education Fund" <<endl;
            cout << "2. Health Insurance" <<endl;
            cout << "3. Family Support Aid" <<endl;
            break;
        }
       default:
       {
           cout << "Invalid code------END!" <<endl;
       }
    }
    return 0;
}
