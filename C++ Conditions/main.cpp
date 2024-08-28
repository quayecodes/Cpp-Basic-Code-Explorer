#include <iostream>

using namespace std;

int main()
{
    cout << "\t Enter Two values Of Your Choice For Comparism" <<endl;
    cout << endl;
    cout << "The Comparism Includes" <<endl;
    cout << "1. Greater Than or equal to(>=)" <<endl;
    cout << "2. Greater than(>)" <<endl;
    cout << "3. Less than or equal to(<=)" <<endl;
    cout << "4. Less than(<)" <<endl;
    cout << "5. Equals to(==)"<<endl;
    cout << "6. Not equals to(!=)"<<endl;
    int value1;
    int value2;
    cout << "Enter Your First Value: ";
    cin >> value1;
    cout << "Enter Your Second Value: ";
    cin >> value2;

    cout <<endl;
    cout << "Condition 1: ";
    if (value1 >= value2) //-----Greater than or equal to condition
    {
        cout << value1 << " is greater than or equal to " << value2 <<endl;
    }
    else
    {
      cout << value1 << " is not greater than or equal to " <<value2 <<endl;
    }

    cout <<endl;
    cout << "Condtion 2: "; //------Greater than condtion
    if (value1 > value2)
    {
        cout <<value1 << " is greater than " <<value2 <<endl;
    }
    else
    {
        cout <<value1 << " is not greater than " <<value2 <<endl;
    }

    cout <<endl;
    cout << "Condition 3: ";  //less than or equal to condition
    if (value1 <= value2)
    {
        cout <<value1 << " is less than or equal to " <<value2 <<endl;
    }
    else
    {
        cout <<value1 << " is not less than or equal to " <<value2 <<endl;
    }

    cout <<endl;
    cout << "Condtion 4: ";
    if (value1 < value2)
    {
        cout << value1 << " is less than " <<value2 <<endl;
    }
    else
    {
        cout << value1 << " is not less than " <<value2 <<endl;
    }

    cout <<endl;
    cout << "Condtion 5: ";
    if (value1==value2)
    {
        cout << value1 << " is equals to " <<value2 <<endl;
    }
    else
    {
        cout << value1 << " is not equals to " <<value2 <<endl;
    }

    cout <<endl;
    cout << "   If (" <<value1 << " is not equal to " <<value2 << ") AND (" <<value1 << " is equals to " <<value2 << ") Then" <<endl;
    bool value3 =(value1 != value2) && (value1==value2); //bool expression
    cout << "Condition 6: bool value " <<value3;

    cout <<endl;
    cout << "\t Code by: Michael N.A Quaye.----Email: millcode@outlook.com" <<endl;
    return 0;
}
