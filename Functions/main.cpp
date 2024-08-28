#include <iostream>

using namespace std;

void menu()
{
    cout << "\t -----Online Course Site----" <<endl;
    cout << "1. Udemy" <<endl;
    cout << "2. Cousera" <<endl;
    cout << "3. ALX Africa" <<endl;
    cout << "4. Code Train" <<endl;
    cout << "5. Free Code Camp" <<endl;
}
void headline()
{
    cout << "\t-------------------F U N C T I O N   D E C L A R A T I O N-----------------" <<endl;
    cout << "Code By: Michael N.A Quaye                           Email: millcode@outlook.com" <<endl;
}
int main()
{
    headline();
    menu();

    int input;
    cout <<endl;
    cout << "Select Option >> ";
    cin >> input;

    switch(input)
    {
    case 1:
        {
            cout << "Udemy Course Selected" <<endl;
            break;
        }
    case 2:
        {
            cout << "Cousera Course Selected" <<endl;
            break;
        }
    case 3:
        {
            cout << "ALX Africa Course Seleected" <<endl;
            break;
        }
    case 4:
        {
            cout << "Code Train Course Selected" <<endl;
            break;
        }
    case 5:
        {
            cout << "Free Code Camp course Selected" <<endl;
            break;
        }
        default:
        {
            cout << "Input Does Not Exist!" <<endl;
        }
    }
    return 0;
}
