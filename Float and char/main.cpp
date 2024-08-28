#include <iostream>

using namespace std;

int main()
{
    float figure;
    cout << "Enter Figure ";
    cin >> figure;
    if (figure < 2.1)
    {
        cout << "Correct value entered" <<endl;
    }
    else
    {
        cout << "Wrong Value" <<endl;
    }
    cout  <<figure <<endl;
    return 0;
}
